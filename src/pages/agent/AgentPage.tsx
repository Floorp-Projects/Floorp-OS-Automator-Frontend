/**
 * @fileoverview Agent実行ページ
 *
 * モダンなAIエージェントスタイルのUI
 * フロー: プロンプト入力 → ワークフロー生成 → 権限確認 → 実行
 *
 * @module pages/agent/AgentPage
 */

import React from "react";
import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Flex,
    Heading,
    HStack,
    IconButton,
    Spinner,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LuArrowLeft,
    LuArrowRight,
    LuCheck,
    LuHouse,
    LuPlay,
    LuRefreshCw,
    LuSend,
    LuShield,
    LuSparkles,
    LuSquare,
    LuTriangleAlert,
    LuX,
} from "react-icons/lu";
import { useAgentExecution } from "./useAgentExecution";
import { WorkflowCanvas, WorkflowFunctionList, hasHighRiskFunctions } from "@/components/workflow";
import { TerminalConsole } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { useI18n } from "@/hooks/useI18n";

/**
 * プロンプト入力ステップ
 */
function PromptStep({
    prompt,
    onPromptChange,
    onSubmit,
    generating,
}: {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    generating: boolean;
}) {
    const { t } = useI18n();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
        }
    }, [prompt]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // IME変換中は無視
        if (e.nativeEvent.isComposing) {
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <VStack gap={6} w="full" maxW="3xl" mx="auto" align="stretch">
            <VStack gap={2} textAlign="center">
                <Box fontSize="5xl" color="floorp.500">
                    <LuSparkles />
                </Box>
                <Heading size="xl">{t("agent.whatToDo")}</Heading>
                <Text color="fg.muted" fontSize="md">
                    {t("agent.promptHint")}
                </Text>
            </VStack>

            <Card.Root>
                <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={4} align="stretch">
                        <Textarea
                            ref={textareaRef}
                            placeholder={t("agent.placeholder")}
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={5}
                            minH="150px"
                            maxH="400px"
                            fontSize="md"
                            resize="none"
                            disabled={generating}
                            borderWidth="2px"
                            _focus={{
                                borderColor: "floorp.500",
                                boxShadow:
                                    "0 0 0 1px var(--chakra-colors-floorp-500)",
                            }}
                        />
                        <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted">
                                {t("agent.sendHint")}
                            </Text>
                            <Button
                                colorPalette="floorp"
                                onClick={onSubmit}
                                disabled={!prompt.trim() || generating}
                            >
                                {generating
                                    ? (
                                        <>
                                            <Spinner size="sm" />
                                            {t("agent.generating")}
                                        </>
                                    )
                                    : (
                                        <>
                                            <LuSparkles />
                                            {t("agent.generateWorkflow")}
                                        </>
                                    )}
                            </Button>
                        </HStack>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </VStack>
    );
}

/**
 * 生成中ステップ
 */
function GeneratingStep({
    events,
    onStop,
}: {
    events: { t: number; kind: string; payload?: unknown }[];
    onStop: () => void;
}) {
    const { t } = useI18n();

    return (
        <VStack gap={6} w="full" maxW="4xl" mx="auto" align="stretch" h="full">
            <VStack gap={2} textAlign="center">
                <Box position="relative">
                    <Spinner size="xl" color="floorp.500" />
                </Box>
                <Heading size="lg">{t("agent.generatingTitle")}</Heading>
                <Text color="fg.muted" fontSize="md">
                    {t("agent.generatingHint")}
                </Text>
            </VStack>

            <Card.Root flex={1} minH={0} overflow="hidden">
                <Card.Body p={4} display="flex" flexDirection="column" h="full">
                    <HStack justify="space-between" mb={3}>
                        <Text fontWeight="medium">
                            {t("agent.generationLog")}
                        </Text>
                        <Button
                            size="sm"
                            variant="ghost"
                            colorPalette="red"
                            onClick={onStop}
                        >
                            <LuSquare />
                            {t("agent.stop")}
                        </Button>
                    </HStack>
                    <Box flex={1} minH={0} overflow="hidden">
                        <TerminalConsole
                            events={events as GenerationEvent[]}
                            streaming={true}
                        />
                    </Box>
                </Card.Body>
            </Card.Root>
        </VStack>
    );
}

/**
 * 権限確認ステップ
 */
function ConfirmStep({
    workflow,
    onConfirm,
    onRefine,
    saving,
    refining,
}: {
    workflow: ReturnType<typeof useAgentExecution>["generatedWorkflow"];
    onConfirm: () => void;
    onRefine: (prompt: string) => void;
    saving: boolean;
    refining: boolean;
}) {
    const { t } = useI18n();
    const [riskAcknowledged, setRiskAcknowledged] = React.useState(false);
    const [refinePrompt, setRefinePrompt] = React.useState("");
    const [showDetailView, setShowDetailView] = React.useState(false);
    const refineTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    // チャットボックスの自動リサイズ
    React.useEffect(() => {
        const textarea = refineTextareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [refinePrompt]);

    const hasWorkflowDefinition = !!workflow?.workflowDefinition;
    const hasHighRisk = hasWorkflowDefinition && workflow.workflowDefinition && hasHighRiskFunctions(workflow.workflowDefinition);
    const canConfirm = !hasHighRisk || riskAcknowledged;

    return (
        <Flex
            direction="column"
            w="full"
            h="full"
            gap={{ base: 2, md: 4 }}
        >
            {/* ヘッダー - モバイル向けにコンパクト化 */}
            <VStack align="stretch" gap={0.5} flexShrink={0}>
                <HStack gap={2}>
                    <Box
                        p={1.5}
                        rounded="md"
                        bg="orange.100"
                        _dark={{ bg: "orange.900/30" }}
                    >
                        <Box fontSize="lg" color="orange.500">
                            <LuShield />
                        </Box>
                    </Box>
                    <Heading size="md">{t("agent.confirmTitle")}</Heading>
                </HStack>
            </VStack>

            {/* メインコンテンツ - 2カラムレイアウト（大画面時） */}
            <Flex
                direction={{ base: "column", lg: "row" }}
                gap={{ base: 2, md: 4 }}
                flex={1}
                minH={0}
                overflow="auto"
            >
                {/* 左カラム：権限とアクション */}
                <VStack
                    align="stretch"
                    gap={{ base: 2, md: 3 }}
                    w={{ base: "full", lg: "300px" }}
                    flexShrink={0}
                >
                    </VStack>

                {/* 右カラム：ワークフローステップ */}
                {hasWorkflowDefinition && (
                    <Card.Root
                        flex={1}
                        minH={{ base: "200px", lg: 0 }}
                        overflow="hidden"
                    >
                        <Card.Body
                            p={0}
                            display="flex"
                            flexDirection="column"
                            h="full"
                        >
                            <HStack
                                px={{ base: 2, md: 4 }}
                                py={2}
                                borderBottomWidth="1px"
                                flexShrink={0}
                                justify="space-between"
                            >
                                <Text fontWeight="medium" fontSize="sm">
                                    {t("agent.workflowSteps")}
                                </Text>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() =>
                                        setShowDetailView(!showDetailView)}
                                    color="fg.muted"
                                    fontSize="xs"
                                >
                                    {showDetailView
                                        ? t("agent.compactView")
                                        : t("agent.detailView")}
                                </Button>
                            </HStack>
                            <Box
                                flex={1}
                                minH={0}
                                overflow="auto"
                            >
                                {workflow?.workflowDefinition && (
                                    showDetailView
                                        ? (
                                            <WorkflowCanvas
                                                workflow={workflow
                                                    .workflowDefinition}
                                                withBackground={false}
                                            />
                                        )
                                        : (
                                            <Box p={{ base: 2, md: 3 }}>
                                                <WorkflowFunctionList
                                                    workflow={workflow
                                                        .workflowDefinition}
                                                />
                                            </Box>
                                        )
                                )}
                            </Box>
                        </Card.Body>
                    </Card.Root>
                )}
            </Flex>

            {/* フッター：アクションボタンとチャットボックス */}
            <Box
                flexShrink={0}
                p={2}
                borderWidth="1px"
                rounded="lg"
                bg="bg.subtle"
                _dark={{ bg: "gray.900" }}
            >
                <VStack gap={2} align="stretch">
                    {/* 高リスク承認 + 実行ボタン（横並び） */}
                    <HStack gap={2}>
                        {hasHighRisk && (
                            <HStack
                                gap={2}
                                align="center"
                                px={2}
                                py={1.5}
                                rounded="md"
                                bg="red.50"
                                borderWidth="1px"
                                borderColor={riskAcknowledged
                                    ? "green.400"
                                    : "red.300"}
                                _dark={{
                                    bg: "red.950/50",
                                    borderColor: riskAcknowledged
                                        ? "green.600"
                                        : "red.700",
                                }}
                                flex={1}
                            >
                                <Checkbox.Root
                                    checked={riskAcknowledged}
                                    onCheckedChange={(e) =>
                                        setRiskAcknowledged(!!e.checked)}
                                    colorPalette="green"
                                    size="sm"
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                </Checkbox.Root>
                                <Text
                                    fontSize="xs"
                                    color="red.700"
                                    _dark={{ color: "red.300" }}
                                >
                                    {t("agent.highRiskAcknowledge")}
                                </Text>
                            </HStack>
                        )}
                        <Button
                            colorPalette={hasHighRisk && !riskAcknowledged
                                ? "gray"
                                : "floorp"}
                            onClick={onConfirm}
                            disabled={saving || !canConfirm}
                            size="md"
                            px={4}
                            flexShrink={0}
                            fontWeight="bold"
                            opacity={canConfirm ? 1 : 0.6}
                        >
                            {saving
                                ? (
                                    <>
                                        <Spinner size="sm" />
                                    </>
                                )
                                : (
                                    <>
                                        <LuPlay size={14} />
                                        {t("agent.confirmAndRun")}
                                    </>
                                )}
                        </Button>
                    </HStack>

                    {/* チャットボックス（ワークフロー修正用）- 常に一番下 */}
                    <HStack gap={2} align="end">
                        <Textarea
                            ref={refineTextareaRef}
                            placeholder={t("agent.refinePlaceholder")}
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            disabled={saving || refining}
                            size="md"
                            resize="none"
                            flex={1}
                            minH="40px"
                            maxH="120px"
                            py={2}
                            fontSize="md"
                            _focus={{
                                borderColor: "floorp.500",
                                boxShadow:
                                    "0 0 0 1px var(--chakra-colors-floorp-500)",
                            }}
                            onKeyDown={(e) => {
                                // IME変換中は無視
                                if (e.nativeEvent.isComposing) {
                                    return;
                                }
                                if (
                                    e.key === "Enter" && !e.shiftKey &&
                                    refinePrompt.trim()
                                ) {
                                    e.preventDefault();
                                    onRefine(refinePrompt.trim());
                                    setRefinePrompt("");
                                }
                            }}
                        />
                        <IconButton
                            aria-label={t("agent.refine")}
                            colorPalette="floorp"
                            variant="ghost"
                            size="md"
                            disabled={!refinePrompt.trim() || saving ||
                                refining}
                            onClick={() => {
                                if (refinePrompt.trim()) {
                                    onRefine(refinePrompt.trim());
                                    setRefinePrompt("");
                                }
                            }}
                        >
                            {refining
                                ? <Spinner size="md" />
                                : <LuSend size={18} />}
                        </IconButton>
                    </HStack>
                </VStack>
            </Box>
        </Flex>
    );
}

/**
 * 実行中ステップ
 */
function ExecutingStep({
    events,
    workflowName,
}: {
    events: { t: number; kind: string; payload?: unknown }[];
    workflowName?: string;
}) {
    const { t } = useI18n();

    return (
        <VStack
            gap={{ base: 2, md: 6 }}
            w="full"
            maxW="4xl"
            mx="auto"
            align="stretch"
            h="full"
        >
            {/* モバイル: コンパクトな横並び / デスクトップ: 縦並び中央揃え */}
            <HStack
                gap={{ base: 3, md: 4 }}
                justify={{ base: "flex-start", md: "center" }}
                align="center"
                py={{ base: 2, md: 4 }}
                flexWrap="wrap"
            >
                <Spinner
                    size={{ base: "md", md: "xl" }}
                    color="floorp.500"
                    flexShrink={0}
                />
                <VStack
                    gap={0}
                    align={{ base: "flex-start", md: "center" }}
                    flex={1}
                    minW={0}
                >
                    <Heading size={{ base: "md", md: "lg" }} lineHeight="short">
                        {t("agent.executingTitle")}
                    </Heading>
                    {workflowName && (
                        <Text
                            fontWeight="medium"
                            fontSize={{ base: "sm", md: "md" }}
                            color="fg.muted"
                            lineClamp={1}
                        >
                            {workflowName}
                        </Text>
                    )}
                </VStack>
            </HStack>

            <Card.Root flex={1} minH={0} overflow="hidden">
                <Card.Body
                    p={{ base: 2, md: 4 }}
                    display="flex"
                    flexDirection="column"
                    h="full"
                >
                    <Text
                        fontWeight="medium"
                        mb={{ base: 2, md: 3 }}
                        fontSize={{ base: "sm", md: "md" }}
                    >
                        {t("agent.executionLog")}
                    </Text>
                    <Box flex={1} minH={0} overflow="hidden">
                        <TerminalConsole
                            events={events as GenerationEvent[]}
                            streaming={true}
                        />
                    </Box>
                </Card.Body>
            </Card.Root>
        </VStack>
    );
}

/**
 * 完了ステップ
 */
function CompletedStep({
    workflowId,
    events,
    onReset,
    onViewWorkflow,
}: {
    workflowId: string | null;
    events: { t: number; kind: string; payload?: unknown }[];
    onReset: () => void;
    onViewWorkflow: () => void;
}) {
    const { t } = useI18n();
    const navigate = useNavigate();

    return (
        <VStack gap={6} w="full" maxW="4xl" mx="auto" align="stretch">
            <VStack gap={2} textAlign="center">
                <Box fontSize="5xl" color="green.500">
                    <LuCheck />
                </Box>
                <Heading size="xl">{t("agent.completedTitle")}</Heading>
                <Text color="fg.muted" fontSize="md">
                    {t("agent.completedHint")}
                </Text>
            </VStack>

            {/* 実行結果 */}
            <Card.Root>
                <Card.Body p={4}>
                    <VStack align="stretch" gap={4}>
                        <HStack justify="space-between">
                            <Text fontWeight="medium">
                                {t("agent.executionResult")}
                            </Text>
                            <Badge colorPalette="green">
                                {t("common.success")}
                            </Badge>
                        </HStack>

                        <Box
                            maxH="400px"
                            overflowY="auto"
                            borderWidth="1px"
                            rounded="md"
                        >
                            <TerminalConsole
                                events={events as GenerationEvent[]}
                                streaming={false}
                            />
                        </Box>
                    </VStack>
                </Card.Body>
            </Card.Root>

            {/* アクションボタン */}
            <HStack justify="center" gap={4} flexWrap="wrap">
                <Button variant="outline" onClick={() => navigate("/home")}>
                    <LuHouse />
                    {t("agent.backToHome")}
                </Button>
                {workflowId && (
                    <Button variant="outline" onClick={onViewWorkflow}>
                        <LuArrowRight />
                        {t("agent.viewWorkflow")}
                    </Button>
                )}
                <Button colorPalette="floorp" onClick={onReset}>
                    <LuRefreshCw />
                    {t("agent.createAnother")}
                </Button>
            </HStack>
        </VStack>
    );
}

/**
 * エラーステップ
 */
function ErrorStep({
    error,
    onRetry,
    onReset,
}: {
    error: string | null;
    onRetry: () => void;
    onReset: () => void;
}) {
    const { t } = useI18n();

    return (
        <VStack gap={6} w="full" maxW="lg" mx="auto" align="stretch">
            <VStack gap={2} textAlign="center">
                <Box fontSize="5xl" color="red.500">
                    <LuX />
                </Box>
                <Heading size="xl">{t("agent.errorTitle")}</Heading>
                <Text color="fg.muted" fontSize="md">
                    {t("agent.errorHint")}
                </Text>
            </VStack>

            <Card.Root
                borderColor="red.300"
                borderWidth="1px"
                bg="red.50/50"
                _dark={{ borderColor: "red.700", bg: "red.950/30" }}
            >
                <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack align="stretch" gap={3}>
                        <HStack gap={2}>
                            <Box color="red.500">
                                <LuTriangleAlert size={18} />
                            </Box>
                            <Text fontWeight="medium" fontSize="sm">
                                {t("agent.errorDetails")}
                            </Text>
                        </HStack>
                        <Box
                            bg="red.100"
                            _dark={{ bg: "red.900/40", color: "red.200" }}
                            p={3}
                            rounded="md"
                            fontFamily="mono"
                            fontSize="sm"
                            color="red.700"
                            wordBreak="break-word"
                        >
                            {error || t("agent.unknownError")}
                        </Box>
                    </VStack>
                </Card.Body>
            </Card.Root>

            <HStack justify="center" gap={4}>
                <Button variant="outline" onClick={onReset} size="lg">
                    <LuArrowLeft />
                    {t("agent.startOver")}
                </Button>
                <Button colorPalette="floorp" onClick={onRetry} size="lg">
                    <LuRefreshCw />
                    {t("agent.retry")}
                </Button>
            </HStack>
        </VStack>
    );
}

/**
 * Agentページメインコンポーネント
 */
export function AgentPage() {
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

    return (
        <Flex direction="column" h="full" overflow="hidden" fontSize="md">
            {/* ヘッダー */}
            <Box
                borderBottomWidth="1px"
                px={3}
                py={2}
                bg="bg.panel"
                flexShrink={0}
            >
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <IconButton
                            aria-label={t("agent.backToHome")}
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate("/home")}
                        >
                            <LuArrowLeft />
                        </IconButton>
                        <Heading size="sm">{t("agent.title")}</Heading>
                    </HStack>
                    {currentStep !== "prompt" && currentStep !== "error" && (
                        <IconButton
                            aria-label={t("agent.reset")}
                            variant="ghost"
                            size="xs"
                            onClick={reset}
                        >
                            <LuRefreshCw />
                        </IconButton>
                    )}
                </HStack>
            </Box>

            {/* メインコンテンツ */}
            <Box
                flex={1}
                minH={0}
                overflow={currentStep === "confirm" ? "hidden" : "auto"}
                px={{ base: 4, md: 6, lg: 8 }}
                py={{ base: 4, md: 6 }}
            >
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
                        workflowName={generatedWorkflow?.workflowDefinition
                            ?.displayName}
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
                    <ErrorStep
                        error={error}
                        onRetry={handleRetry}
                        onReset={reset}
                    />
                )}
            </Box>
        </Flex>
    );
}
