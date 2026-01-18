/**
 * @fileoverview Agentワークフロー生成・実行を管理するカスタムフック
 *
 * エージェントフロー: プロンプト入力 → ワークフロー生成 → 権限確認 → 実行
 *
 * @module pages/agent/useAgentExecution
 */

import React from "react";
import { create } from "@bufbuild/protobuf";
import { clients } from "@/lib/grpc-clients";
import type {
  GenerateWorkflowResponse,
  RunWorkflowResponse,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import { WorkflowSourceByIdSchema } from "@/gen/sapphillon/v1/workflow_service_pb";

/**
 * エージェント実行のステップ
 */
export type AgentStep =
  | "prompt"
  | "generating"
  | "confirm"
  | "executing"
  | "completed"
  | "error";

/**
 * 生成/実行中のイベント
 */
export type AgentEvent = {
  /** イベント発生時刻（Unixタイムスタンプ） */
  t: number;
  /** イベント種別 */
  kind: "message" | "error" | "done" | "progress";
  /** イベントのペイロード（種別により異なる） */
  payload?: unknown;
};

/**
 * useAgentExecutionフックの戻り値
 */
export interface UseAgentExecutionReturn {
  /** 現在のステップ */
  currentStep: AgentStep;
  /** ステップを設定 */
  setCurrentStep: (step: AgentStep) => void;
  /** 現在ストリーミング中かどうか */
  generating: boolean;
  /** 現在実行中かどうか */
  executing: boolean;
  /** 発生したイベントのリスト */
  events: AgentEvent[];
  /** 最後に受信したワークフロー定義 */
  generatedWorkflow: GenerateWorkflowResponse | null;
  /** ワークフロー実行結果 */
  runResult: RunWorkflowResponse | null;
  /** エラーメッセージ */
  error: string | null;
  /** 保存されたワークフローID */
  savedWorkflowId: string | null;
  /** ワークフロー生成を開始 */
  generate: (prompt: string) => Promise<void>;
  /** ワークフローを修正（追加指示で再生成） */
  refine: (additionalPrompt: string) => Promise<void>;
  /** 修正中かどうか */
  refining: boolean;
  /** 生成を停止 */
  stopGeneration: () => void;
  /** 権限を確認してワークフローを保存 */
  confirmAndSave: () => Promise<void>;
  /** 保存されたワークフローを実行 */
  executeWorkflow: () => Promise<void>;
  /** すべてをリセット */
  reset: () => void;
  /** イベントログをクリア */
  clearEvents: () => void;
}

/**
 * エージェント実行フック
 *
 * プロンプトからワークフローを生成し、権限確認後に実行するフロー全体を管理します。
 */
export function useAgentExecution(): UseAgentExecutionReturn {
  const [currentStep, setCurrentStep] = React.useState<AgentStep>("prompt");
  const [generating, setGenerating] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [generatedWorkflow, setGeneratedWorkflow] =
    React.useState<GenerateWorkflowResponse | null>(null);
  const [runResult, setRunResult] = React.useState<RunWorkflowResponse | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [savedWorkflowId, setSavedWorkflowId] = React.useState<string | null>(
    null
  );
  const [savedCodeId, setSavedCodeId] = React.useState<string | null>(null);
  const [refining, setRefining] = React.useState(false);
  const [originalPrompt, setOriginalPrompt] = React.useState<string>("");
  const abortRef = React.useRef<AbortController | null>(null);

  const append = React.useCallback((e: Omit<AgentEvent, "t">) => {
    setEvents((prev) => [...prev, { t: Date.now(), ...e }]);
  }, []);

  /**
   * ワークフロー生成
   */
  const generate = React.useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || generating) return;

      setError(null);
      setEvents([]);
      setRunResult(null);
      setGeneratedWorkflow(null);
      setSavedWorkflowId(null);
      setSavedCodeId(null);
      setCurrentStep("generating");
      setGenerating(true);
      setOriginalPrompt(prompt);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        for await (const msg of clients.workflow.generateWorkflow(
          { prompt },
          { signal: ac.signal }
        )) {
          setGeneratedWorkflow(msg);
          append({ kind: "message", payload: msg });
        }
        append({ kind: "done", payload: { stage: "generate" } });
        setCurrentStep("confirm");
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setCurrentStep("prompt");
          return;
        }
        setError((e as Error).message || "生成中にエラーが発生しました");
        setCurrentStep("error");
        append({ kind: "error", payload: e });
      } finally {
        setGenerating(false);
        abortRef.current = null;
      }
    },
    [append, generating]
  );

  /**
   * ワークフローを修正（追加指示で再生成）
   */
  const refine = React.useCallback(
    async (additionalPrompt: string) => {
      if (!additionalPrompt.trim() || refining || generating) return;

      setRefining(true);
      setEvents([]);
      setCurrentStep("generating");

      const ac = new AbortController();
      abortRef.current = ac;

      // 元のプロンプトと追加指示を組み合わせる
      const combinedPrompt = `${originalPrompt}\n\n追加の指示: ${additionalPrompt}`;

      try {
        for await (const msg of clients.workflow.generateWorkflow(
          { prompt: combinedPrompt },
          { signal: ac.signal }
        )) {
          setGeneratedWorkflow(msg);
          append({ kind: "message", payload: msg });
        }
        append({ kind: "done", payload: { stage: "refine" } });
        setCurrentStep("confirm");
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setCurrentStep("confirm");
          return;
        }
        setError((e as Error).message || "修正中にエラーが発生しました");
        setCurrentStep("error");
        append({ kind: "error", payload: e });
      } finally {
        setRefining(false);
        abortRef.current = null;
      }
    },
    [append, refining, generating, originalPrompt]
  );

  /**
   * 生成を停止
   */
  const stopGeneration = React.useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
    setRefining(false);
    setCurrentStep("prompt");
  }, []);

  /**
   * 権限を確認してワークフローを保存
   */
  const confirmAndSave = React.useCallback(async () => {
    if (!generatedWorkflow?.workflowDefinition) return;

    try {
      append({ kind: "message", payload: { stage: "save", status: "start" } });

      const saveResponse = await clients.workflow.updateWorkflow({
        workflow: generatedWorkflow.workflowDefinition,
      });

      if (!saveResponse.workflow?.id) {
        throw new Error("Failed to save workflow: no ID returned");
      }

      setSavedWorkflowId(saveResponse.workflow.id);
      setSavedCodeId(saveResponse.workflow.workflowCode?.[0]?.id || "");

      append({
        kind: "message",
        payload: {
          stage: "save",
          status: "done",
          workflowId: saveResponse.workflow.id,
        },
      });
    } catch (e) {
      setError((e as Error).message || "保存中にエラーが発生しました");
      setCurrentStep("error");
      append({ kind: "error", payload: e });
    }
  }, [generatedWorkflow, append]);

  /**
   * ワークフローを実行
   */
  const executeWorkflow = React.useCallback(async () => {
    if (!savedWorkflowId) {
      // まだ保存していない場合は、まず保存してから実行
      if (generatedWorkflow?.workflowDefinition) {
        await confirmAndSave();
      } else {
        return;
      }
    }

    // 保存後にIDを取得するためにstateを参照
    const workflowId = savedWorkflowId;
    const codeId = savedCodeId;

    if (!workflowId) return;

    setCurrentStep("executing");
    setExecuting(true);

    try {
      append({ kind: "message", payload: { stage: "run", status: "start" } });

      const res = await clients.workflow.runWorkflow({
        byId: create(WorkflowSourceByIdSchema, {
          workflowId,
          workflowCodeId: codeId || "",
        }),
      });

      setRunResult(res);
      append({ kind: "message", payload: res });
      append({ kind: "done", payload: { stage: "run" } });
      setCurrentStep("completed");
    } catch (e) {
      setError((e as Error).message || "実行中にエラーが発生しました");
      setCurrentStep("error");
      append({ kind: "error", payload: e });
    } finally {
      setExecuting(false);
    }
  }, [savedWorkflowId, savedCodeId, generatedWorkflow, confirmAndSave, append]);

  /**
   * すべてをリセット
   */
  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    setCurrentStep("prompt");
    setGenerating(false);
    setExecuting(false);
    setRefining(false);
    setEvents([]);
    setGeneratedWorkflow(null);
    setRunResult(null);
    setError(null);
    setSavedWorkflowId(null);
    setSavedCodeId(null);
    setOriginalPrompt("");
  }, []);

  const clearEvents = React.useCallback(() => {
    setEvents([]);
  }, []);

  return {
    currentStep,
    setCurrentStep,
    generating,
    executing,
    events,
    generatedWorkflow,
    runResult,
    error,
    savedWorkflowId,
    generate,
    refine,
    refining,
    stopGeneration,
    confirmAndSave,
    executeWorkflow,
    reset,
    clearEvents,
  };
}
