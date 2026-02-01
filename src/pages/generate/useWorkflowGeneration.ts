/**
 * @fileoverview ワークフロー生成と実行を管理するカスタムフック
 *
 * @module pages/generate/useWorkflowGeneration
 */

import React from "react";
import { create } from "@bufbuild/protobuf";
import { clients } from "@/lib/grpc-clients";
import { enhanceWorkflowWithMockData } from "@/lib/mock-workflow-data";
import type {
  GenerateWorkflowResponse,
  RunWorkflowResponse,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import { WorkflowSourceByIdSchema } from "@/gen/sapphillon/v1/workflow_service_pb";

/**
 * ワークフロー生成中のイベント
 */
export type GenerationEvent = {
  /** イベント発生時刻（Unixタイムスタンプ） */
  t: number;
  /** イベント種別 */
  kind: "message" | "error" | "done";
  /** イベントのペイロード（種別により異なる） */
  payload?: unknown;
};

/**
 * useWorkflowGenerationフックの戻り値
 */
export interface UseWorkflowGenerationReturn {
  /** 現在ストリーミング中かどうか */
  streaming: boolean;
  /** 生成中に発生したイベントのリスト */
  events: GenerationEvent[];
  /** 最後に受信したワークフロー定義 */
  latest: GenerateWorkflowResponse | null;
  /** ワークフロー実行結果 */
  runRes: RunWorkflowResponse | null;
  /** ワークフロー生成を開始 */
  start: (prompt: string) => Promise<void>;
  /** ストリーミングを停止 */
  stop: () => void;
  /** イベントログをクリア */
  clearEvents: () => void;
  /** 最後に生成されたワークフローを実行 */
  runLatest: () => Promise<void>;
}

/**
 * ワークフロー生成・実行フック
 *
 * プロンプトからワークフローを生成し、実行するための状態管理とロジックを提供します。
 * ストリーミングによるリアルタイム生成、中断、実行を含みます。
 *
 * @returns ワークフロー生成・実行のための状態と関数
 *
 * @example
 * ```tsx
 * function WorkflowGenerator() {
 *   const { streaming, latest, start, stop, runLatest } = useWorkflowGeneration();
 *   const [prompt, setPrompt] = React.useState("");
 *
 *   return (
 *     <div>
 *       <Textarea
 *         value={prompt}
 *         onChange={(e) => setPrompt(e.target.value)}
 *         placeholder="例: メールを送信して、結果をスプレッドシートに記録"
 *       />
 *       <Button
 *         onClick={() => start(prompt)}
 *         isLoading={streaming}
 *       >
 *         生成開始
 *       </Button>
 *       {streaming && <Button onClick={stop}>停止</Button>}
 *       {latest && (
 *         <Button onClick={runLatest}>
 *           ワークフローを実行
 *         </Button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // イベントログの表示
 * function EventLog() {
 *   const { events } = useWorkflowGeneration();
 *
 *   return (
 *     <VStack>
 *       {events.map((event, i) => (
 *         <Box key={i}>
 *           <Badge>{event.kind}</Badge>
 *           <Text>{new Date(event.t).toLocaleTimeString()}</Text>
 *         </Box>
 *       ))}
 *     </VStack>
 *   );
 * }
 * ```
 */
export function useWorkflowGeneration(): UseWorkflowGenerationReturn {
  const [streaming, setStreaming] = React.useState(false);
  const [events, setEvents] = React.useState<GenerationEvent[]>([]);
  const [latest, setLatest] = React.useState<GenerateWorkflowResponse | null>(
    null,
  );
  const [runRes, setRunRes] = React.useState<RunWorkflowResponse | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const append = React.useCallback((e: Omit<GenerationEvent, "t">) => {
    setEvents((prev) => [...prev, { t: Date.now(), ...e }]);
  }, []);

  const start = React.useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || streaming) return;
      setEvents([]);
      setRunRes(null);
      setLatest(null);
      setStreaming(true);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        for await (const msg of clients.workflow.generateWorkflow(
          { prompt },
          { signal: ac.signal },
        )) {
          // ワークフロー定義にモックプラグインデータを追加
          if (msg.workflowDefinition) {
            const enhancedWorkflow = enhanceWorkflowWithMockData(
              msg.workflowDefinition,
            );
            const enhancedMsg = {
              ...msg,
              workflowDefinition: enhancedWorkflow,
            };
            setLatest(enhancedMsg);
            append({ kind: "message", payload: enhancedMsg });
          } else {
            setLatest(msg);
            append({ kind: "message", payload: msg });
          }
        }
        append({ kind: "done", payload: { stage: "generate" } });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        append({ kind: "error", payload: e });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [append, streaming],
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearEvents = React.useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * 最後に生成されたワークフローを実行
   *
   * ワークフローを保存してからIDで実行します。
   */
  const runLatest = React.useCallback(async () => {
    if (!latest?.workflowDefinition) return;
    try {
      append({ kind: "message", payload: { stage: "save", status: "start" } });

      // ワークフローを保存
      const saveResponse = await clients.workflow.updateWorkflow({
        workflow: latest.workflowDefinition,
      });

      if (!saveResponse.workflow?.id) {
        throw new Error("Failed to save workflow: no ID returned");
      }

      const workflowId = saveResponse.workflow.id;
      const workflowCodeId = saveResponse.workflow.workflowCode?.[0]?.id || "";

      append({
        kind: "message",
        payload: { stage: "save", status: "done", workflowId },
      });

      // 保存されたワークフローをIDで実行
      append({ kind: "message", payload: { stage: "run", status: "start" } });

      const res = await clients.workflow.runWorkflow({
        byId: create(WorkflowSourceByIdSchema, {
          workflowId,
          workflowCodeId,
        }),
      });

      setRunRes(res);
      append({ kind: "message", payload: res });
      append({ kind: "done", payload: { stage: "run" } });
    } catch (e) {
      append({ kind: "error", payload: e });
    }
  }, [latest, append]);

  return {
    streaming,
    events,
    latest,
    runRes,
    start,
    stop,
    clearEvents,
    runLatest,
  } as const;
}
