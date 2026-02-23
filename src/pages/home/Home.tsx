/**
 * @fileoverview Homeページ - Agent統合版
 *
 * AIワークフロー生成と実行の統合インターフェース
 * フロー: idle → prompt → generating → confirm → executing → completed
 *
 * @module pages/home/Home
 */

import React from "react";
import { Box, Flex, Heading, HStack, IconButton } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuRefreshCw } from "react-icons/lu";
import { useAgentExecution } from "@/pages/agent/useAgentExecution";
import {
  CompletedStep,
  ConfirmStep,
  ErrorStep,
  ExecutingStep,
  GeneratingStep,
  IdleStep,
  PromptStep,
  StepIndicator,
} from "@/pages/agent/components";
import { useI18n } from "@/hooks/useI18n";

/**
 * Homeページメインコンポーネント
 *
 * AIワークフロー生成と実行のための統合インターフェース
 * Agentページの機能を統合し、idleステップでダッシュボードを表示
 */
export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentStep,
    generating,
    executing,
    saving,
    events,
    generatedWorkflow,
    error,
    savedWorkflowId,
    generate,
    refine,
    refining,
    stopGeneration,
    confirmAndSave,
    executeWorkflow,
    reset,
  } = useAgentExecution();

  // 初期プロンプトをlocationから取得
  const [prompt, setPrompt] = React.useState(() => {
    const state = location.state as { prompt?: string } | null;
    return state?.prompt || "";
  });

  // 連打防止用の同期フラグ
  const isRunningRef = React.useRef(false);

  // 初期プロンプトがある場合、自動的に生成を開始
  const hasStartedRef = React.useRef(false);
  React.useEffect(() => {
    const state = location.state as
      | { prompt?: string; autoStart?: boolean }
      | null;
    if (state?.prompt && state?.autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      generate(state.prompt);
    }
  }, [location.state, generate]);

  const handleSubmit = React.useCallback(() => {
    if (prompt.trim()) {
      generate(prompt);
    }
  }, [prompt, generate]);

  const handleConfirmAndRun = React.useCallback(async () => {
    // 同期ガード: ref で即座にチェック（連打防止）
    if (isRunningRef.current) return;
    // 状態チェックも併用
    if (saving || executing) return;

    isRunningRef.current = true;
    try {
      // 保存してIDを取得
      const savedIds = await confirmAndSave();
      if (!savedIds) {
        // 保存失敗または既に保存中
        return;
      }
      // 取得したIDを直接渡して実行
      await executeWorkflow(savedIds);
    } finally {
      isRunningRef.current = false;
    }
  }, [confirmAndSave, executeWorkflow, saving, executing]);

  const handleViewWorkflow = React.useCallback(() => {
    if (savedWorkflowId) {
      navigate(`/workflows/${savedWorkflowId}`);
    }
  }, [navigate, savedWorkflowId]);

  const handleRetry = React.useCallback(() => {
    if (prompt.trim()) {
      generate(prompt);
    }
  }, [prompt, generate]);

  // idle/prompt以外のステップでリセットボタンを表示
  const showResetButton = currentStep !== "idle" &&
    currentStep !== "prompt" &&
    currentStep !== "error";

  return (
    <Flex
      direction="column"
      h="full"
      overflow="hidden"
      fontSize="md"
      position="relative"
      bg="bg"
    >
      {/* モバイルヘッダー (idle以外で表示) */}
      {currentStep !== "idle" && (
        <Box
          borderBottomWidth="1px"
          px={3}
          py={2}
          bg="bg.panel/80"
          backdropFilter="blur(8px)"
          flexShrink={0}
          display={{ base: "block", lg: "none" }}
          position="relative"
          zIndex={1}
        >
          <HStack justify="space-between" align="center">
            <Heading size="sm">{t("agent.title")}</Heading>
            {showResetButton && (
              <IconButton
                aria-label={t("agent.reset")}
                variant="ghost"
                size="sm"
                onClick={reset}
                borderRadius="lg"
              >
                <LuRefreshCw />
              </IconButton>
            )}
          </HStack>
        </Box>
      )}

      {/* ステップインジケーター (idle/error以外で表示) */}
      {currentStep !== "idle" && currentStep !== "error" && (
        <Box position="relative" zIndex={1}>
          <StepIndicator currentStep={currentStep} />
        </Box>
      )}

      {/* メインコンテンツ */}
      <Flex
        flex={1}
        minH={0}
        overflow={currentStep === "confirm" ? "hidden" : "auto"}
        px={{ base: 3, md: 6, lg: 10 }}
        py={{ base: 2, md: 4, lg: 6 }}
        direction="column"
        position="relative"
        zIndex={1}
      >
        {currentStep === "idle" && (
          <IdleStep
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            generating={generating}
          />
        )}

        {currentStep === "prompt" && (
          <PromptStep
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            generating={generating}
          />
        )}

        {currentStep === "generating" && (
          <GeneratingStep events={events} onStop={stopGeneration} />
        )}

        {currentStep === "confirm" && (
          <ConfirmStep
            workflow={generatedWorkflow}
            onConfirm={handleConfirmAndRun}
            onRefine={(prompt) => refine(prompt)}
            saving={saving || executing}
            refining={refining}
          />
        )}

        {currentStep === "executing" && (
          <ExecutingStep
            events={events}
            workflowName={generatedWorkflow?.workflowDefinition?.displayName}
          />
        )}

        {currentStep === "completed" && (
          <CompletedStep
            workflowId={savedWorkflowId}
            events={events}
            onReset={reset}
            onViewWorkflow={handleViewWorkflow}
          />
        )}

        {currentStep === "error" && (
          <ErrorStep error={error} onRetry={handleRetry} onReset={reset} />
        )}
      </Flex>
    </Flex>
  );
}
