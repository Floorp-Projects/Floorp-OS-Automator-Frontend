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
    LuClipboard,
    LuDownload,
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
import {
    hasHighRiskFunctions,
    WorkflowCanvas,
    WorkflowFunctionList,
} from "@/components/workflow";
import { TerminalConsole } from "@/components/console";
import type { TerminalConsoleHandle } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { useI18n } from "@/hooks/useI18n";
import { Tooltip } from "@/components/ui/tooltip";

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
        <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            h="full"
            minH={{ base: "auto", lg: "400px" }}
        >
            <VStack
                gap={{ base: 6, lg: 8 }}
                w="full"
                maxW={{ base: "3xl", lg: "4xl", xl: "5xl" }}
                align="stretch"
            >
                {/* デスクトップ：よりインパクトのあるヘッダー */}
                <VStack gap={{ base: 2, lg: 4 }} textAlign="center">
                    <Box
                        fontSize={{ base: "5xl", lg: "6xl" }}
                        color="floorp.500"
                        transition="transform 0.2s"
                        _hover={{ transform: "scale(1.05)" }}
                    >
                        <LuSparkles />
                    </Box>
                    <Heading size={{ base: "xl", lg: "2xl" }}>
                        {t("agent.whatToDo")}
                    </Heading>
                    <Text
                        color="fg.muted"
                        fontSize={{ base: "md", lg: "lg" }}
                        maxW="2xl"
                    >
                        {t("agent.promptHint")}
                    </Text>
                </VStack>

                {/* 入力カード：デスクトップ向けに強化 */}
                <Card.Root
                    shadow={{ base: "sm", lg: "md" }}
                    transition="all 0.2s"
                    _hover={{ shadow: { lg: "lg" } }}
                >
                    <Card.Body p={{ base: 4, md: 6, lg: 8 }}>
                        <VStack gap={{ base: 4, lg: 6 }} align="stretch">
                            <Textarea
                                ref={textareaRef}
                                placeholder={t("agent.placeholder")}
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={5}
                                minH={{ base: "150px", lg: "180px" }}
                                maxH="400px"
                                fontSize={{ base: "md", lg: "lg" }}
                                resize="none"
                                disabled={generating}
                                borderWidth="2px"
                                _focus={{
                                    borderColor: "floorp.500",
                                    boxShadow:
                                        "0 0 0 1px var(--chakra-colors-floorp-500)",
                                }}
                            />
                            <HStack justify="space-between" align="center">
                                <Text
                                    fontSize={{ base: "sm", lg: "md" }}
                                    color="fg.muted"
                                >
                                    {t("agent.sendHint")}
                                </Text>
                                <Button
                                    colorPalette="floorp"
                                    size={{ base: "md", lg: "lg" }}
                                    onClick={onSubmit}
                                    disabled={!prompt.trim() || generating}
                                    px={{ base: 4, lg: 6 }}
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
        </Flex>
    );
}

/**
 * コンソールツールバー（コピー・ダウンロードボタン）
 */
function ConsoleToolbar({
    consoleRef,
}: {
    consoleRef: React.RefObject<TerminalConsoleHandle | null>;
}) {
    const { t } = useI18n();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await consoleRef.current?.copy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <HStack gap={1}>
            <Tooltip content={copied ? t("console.copied") : t("console.copy")}>
                <IconButton
                    aria-label={t("console.copy")}
                    size="xs"
                    variant="ghost"
                    color={copied ? "green.500" : "fg.muted"}
                    onClick={handleCopy}
                >
                    {copied ? <LuCheck size={14} /> : <LuClipboard size={14} />}
                </IconButton>
            </Tooltip>
            <Tooltip content={t("console.download")}>
                <IconButton
                    aria-label={t("console.download")}
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    onClick={() => consoleRef.current?.download()}
                >
                    <LuDownload size={14} />
                </IconButton>
            </Tooltip>
        </HStack>
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
    const consoleRef = React.useRef<TerminalConsoleHandle>(null);

    return (
        <VStack
            gap={{ base: 4, lg: 6 }}
            w="full"
            maxW={{ base: "4xl", lg: "5xl", xl: "6xl" }}
            mx="auto"
            align="stretch"
            h="full"
        >
            <VStack gap={{ base: 2, lg: 3 }} textAlign="center">
                <Box position="relative">
                    <Spinner
                        size={{ base: "xl", lg: "xl" }}
                        color="floorp.500"
                    />
                </Box>
                <Heading size={{ base: "lg", lg: "xl" }}>
                    {t("agent.generatingTitle")}
                </Heading>
                <Text color="fg.muted" fontSize={{ base: "md", lg: "lg" }}>
                    {t("agent.generatingHint")}
                </Text>
            </VStack>

            <Card.Root
                flex={1}
                minH={0}
                overflow="hidden"
                shadow={{ base: "sm", lg: "md" }}
            >
                <Card.Body
                    p={{ base: 3, lg: 5 }}
                    display="flex"
                    flexDirection="column"
                    h="full"
                >
                    <HStack justify="space-between" mb={{ base: 3, lg: 4 }}>
                        <Text
                            fontWeight="semibold"
                            fontSize={{ base: "md", lg: "lg" }}
                        >
                            {t("agent.generationLog")}
                        </Text>
                        <HStack gap={2}>
                            <ConsoleToolbar consoleRef={consoleRef} />
                            <Button
                                size={{ base: "sm", lg: "md" }}
                                variant="ghost"
                                colorPalette="red"
                                onClick={onStop}
                            >
                                <LuSquare />
                                {t("agent.stop")}
                            </Button>
                        </HStack>
                    </HStack>
                    <Box flex={1} minH={0} overflow="hidden">
                        <TerminalConsole
                            ref={consoleRef}
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
    const hasHighRisk = hasWorkflowDefinition && workflow.workflowDefinition &&
        hasHighRiskFunctions(workflow.workflowDefinition);
    const canConfirm = !hasHighRisk || riskAcknowledged;

    return (
        <Flex
            direction="column"
            w="full"
            h="full"
            gap={{ base: 2, md: 4, lg: 6 }}
            maxW={{ lg: "6xl", xl: "7xl" }}
            mx="auto"
        >
            {/* ヘッダー - デスクトップでは少し大きく */}
            <HStack gap={3} flexShrink={0}>
                <Box
                    p={{ base: 1.5, lg: 2 }}
                    rounded="lg"
                    bg="orange.100"
                    _dark={{ bg: "orange.900/30" }}
                >
                    <Box fontSize={{ base: "lg", lg: "xl" }} color="orange.500">
                        <LuShield />
                    </Box>
                </Box>
                <Heading size={{ base: "md", lg: "lg" }}>
                    {t("agent.confirmTitle")}
                </Heading>
            </HStack>

            {/* メインコンテンツ - フル幅のワークフロー表示 */}
            {hasWorkflowDefinition && (
                <Card.Root
                    flex={1}
                    minH={{ base: "200px", lg: "300px" }}
                    overflow="hidden"
                    shadow={{ base: "sm", lg: "md" }}
                >
                    <Card.Body
                        p={0}
                        display="flex"
                        flexDirection="column"
                        h="full"
                    >
                        <HStack
                            px={{ base: 3, lg: 5 }}
                            py={{ base: 2, lg: 3 }}
                            borderBottomWidth="1px"
                            flexShrink={0}
                            justify="space-between"
                            bg="bg.subtle"
                        >
                            <Text
                                fontWeight="semibold"
                                fontSize={{ base: "sm", lg: "md" }}
                            >
                                {t("agent.workflowSteps")}
                            </Text>
                            <Button
                                size={{ base: "xs", lg: "sm" }}
                                variant="ghost"
                                onClick={() =>
                                    setShowDetailView(!showDetailView)}
                                color="fg.muted"
                            >
                                {showDetailView
                                    ? t("agent.compactView")
                                    : t("agent.detailView")}
                            </Button>
                        </HStack>
                        <Box flex={1} minH={0} overflow="auto">
                            {workflow?.workflowDefinition &&
                                (showDetailView
                                    ? (
                                        <WorkflowCanvas
                                            workflow={workflow
                                                .workflowDefinition}
                                            withBackground={false}
                                        />
                                    )
                                    : (
                                        <Box p={{ base: 3, lg: 5 }}>
                                            <WorkflowFunctionList
                                                workflow={workflow
                                                    .workflowDefinition}
                                            />
                                        </Box>
                                    ))}
                        </Box>
                    </Card.Body>
                </Card.Root>
            )}

            {/* フッター：アクションボタンとチャットボックス */}
            <Box
                flexShrink={0}
                p={{ base: 2, lg: 4 }}
                borderWidth="1px"
                rounded="xl"
                bg="bg.subtle"
                _dark={{ bg: "gray.900" }}
                shadow="sm"
            >
                <VStack gap={{ base: 2, lg: 3 }} align="stretch">
                    {/* 高リスク承認 + 実行ボタン */}
                    <Flex
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 2, md: 3 }}
                        align={{ md: "center" }}
                    >
                        {hasHighRisk && (
                            <HStack
                                gap={2}
                                align="center"
                                px={3}
                                py={2}
                                rounded="lg"
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
                                flex={{ md: 1 }}
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
                                    fontSize={{ base: "xs", lg: "sm" }}
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
                            size={{ base: "md", lg: "lg" }}
                            px={{ base: 4, lg: 6 }}
                            flexShrink={0}
                            fontWeight="bold"
                            opacity={canConfirm ? 1 : 0.6}
                            ml={{ md: hasHighRisk ? 0 : "auto" }}
                        >
                            {saving ? <Spinner size="sm" /> : (
                                <>
                                    <LuPlay size={16} />
                                    {t("agent.confirmAndRun")}
                                </>
                            )}
                        </Button>
                    </Flex>

                    {/* チャットボックス（ワークフロー修正用） */}
                    <HStack gap={2} align="end">
                        <Textarea
                            ref={refineTextareaRef}
                            placeholder={t("agent.refinePlaceholder")}
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            disabled={saving || refining}
                            resize="none"
                            flex={1}
                            minH={{ base: "40px", lg: "48px" }}
                            maxH="120px"
                            py={2}
                            fontSize={{ base: "md", lg: "md" }}
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
                            size={{ base: "md", lg: "lg" }}
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
                                : <LuSend size={20} />}
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
    const consoleRef = React.useRef<TerminalConsoleHandle>(null);

    return (
        <VStack
            gap={{ base: 3, md: 5, lg: 6 }}
            w="full"
            maxW={{ base: "4xl", lg: "5xl", xl: "6xl" }}
            mx="auto"
            align="stretch"
            h="full"
        >
            {/* モバイル: コンパクトな横並び / デスクトップ: 縦並び中央揃え */}
            <HStack
                gap={{ base: 3, lg: 4 }}
                justify={{ base: "flex-start", lg: "center" }}
                align="center"
                py={{ base: 2, lg: 4 }}
                flexWrap="wrap"
            >
                <Spinner
                    size={{ base: "md", lg: "xl" }}
                    color="floorp.500"
                    flexShrink={0}
                />
                <VStack
                    gap={0}
                    align={{ base: "flex-start", lg: "center" }}
                    flex={1}
                    minW={0}
                >
                    <Heading size={{ base: "md", lg: "xl" }} lineHeight="short">
                        {t("agent.executingTitle")}
                    </Heading>
                    {workflowName && (
                        <Text
                            fontWeight="medium"
                            fontSize={{ base: "sm", lg: "md" }}
                            color="fg.muted"
                            lineClamp={1}
                        >
                            {workflowName}
                        </Text>
                    )}
                </VStack>
            </HStack>

            <Card.Root
                flex={1}
                minH={0}
                overflow="hidden"
                shadow={{ base: "sm", lg: "md" }}
            >
                <Card.Body
                    p={{ base: 3, lg: 5 }}
                    display="flex"
                    flexDirection="column"
                    h="full"
                >
                    <HStack justify="space-between" mb={{ base: 2, lg: 4 }}>
                        <Text
                            fontWeight="semibold"
                            fontSize={{ base: "sm", lg: "lg" }}
                        >
                            {t("agent.executionLog")}
                        </Text>
                        <ConsoleToolbar consoleRef={consoleRef} />
                    </HStack>
                    <Box flex={1} minH={0} overflow="hidden">
                        <TerminalConsole
                            ref={consoleRef}
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
    const consoleRef = React.useRef<TerminalConsoleHandle>(null);

    return (
        <VStack
            gap={{ base: 6, lg: 8 }}
            w="full"
            maxW={{ base: "4xl", lg: "5xl", xl: "6xl" }}
            mx="auto"
            align="stretch"
        >
            <VStack gap={{ base: 2, lg: 4 }} textAlign="center">
                <Box
                    fontSize={{ base: "5xl", lg: "6xl" }}
                    color="green.500"
                    transition="transform 0.2s"
                >
                    <LuCheck />
                </Box>
                <Heading size={{ base: "xl", lg: "2xl" }}>
                    {t("agent.completedTitle")}
                </Heading>
                <Text color="fg.muted" fontSize={{ base: "md", lg: "lg" }}>
                    {t("agent.completedHint")}
                </Text>
            </VStack>

            {/* 実行結果 */}
            <Card.Root shadow={{ base: "sm", lg: "md" }}>
                <Card.Body p={{ base: 4, lg: 6 }}>
                    <VStack align="stretch" gap={{ base: 4, lg: 5 }}>
                        <HStack justify="space-between">
                            <Text
                                fontWeight="semibold"
                                fontSize={{ base: "md", lg: "lg" }}
                            >
                                {t("agent.executionResult")}
                            </Text>
                            <HStack gap={2}>
                                <ConsoleToolbar consoleRef={consoleRef} />
                                <Badge colorPalette="green" size={{ lg: "lg" }}>
                                    {t("common.success")}
                                </Badge>
                            </HStack>
                        </HStack>

                        <Box
                            maxH={{ base: "400px", lg: "500px" }}
                            overflowY="auto"
                            borderWidth="1px"
                            rounded="lg"
                        >
                            <TerminalConsole
                                ref={consoleRef}
                                events={events as GenerationEvent[]}
                                streaming={false}
                            />
                        </Box>
                    </VStack>
                </Card.Body>
            </Card.Root>

            {/* アクションボタン */}
            <HStack justify="center" gap={{ base: 3, lg: 4 }} flexWrap="wrap">
                <Button
                    variant="outline"
                    size={{ base: "md", lg: "lg" }}
                    onClick={() => navigate("/home")}
                >
                    <LuHouse />
                    {t("agent.backToHome")}
                </Button>
                {workflowId && (
                    <Button
                        variant="outline"
                        size={{ base: "md", lg: "lg" }}
                        onClick={onViewWorkflow}
                    >
                        <LuArrowRight />
                        {t("agent.viewWorkflow")}
                    </Button>
                )}
                <Button
                    colorPalette="floorp"
                    size={{ base: "md", lg: "lg" }}
                    onClick={onReset}
                >
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
        <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            h="full"
            minH={{ base: "auto", lg: "400px" }}
        >
            <VStack
                gap={{ base: 6, lg: 8 }}
                w="full"
                maxW={{ base: "lg", lg: "xl" }}
                align="stretch"
            >
                <VStack gap={{ base: 2, lg: 4 }} textAlign="center">
                    <Box fontSize={{ base: "5xl", lg: "6xl" }} color="red.500">
                        <LuX />
                    </Box>
                    <Heading size={{ base: "xl", lg: "2xl" }}>
                        {t("agent.errorTitle")}
                    </Heading>
                    <Text
                        color="fg.muted"
                        fontSize={{ base: "md", lg: "lg" }}
                    >
                        {t("agent.errorHint")}
                    </Text>
                </VStack>

                <Card.Root
                    borderColor="red.300"
                    borderWidth="1px"
                    bg="red.50/50"
                    _dark={{ borderColor: "red.700", bg: "red.950/30" }}
                    shadow={{ base: "sm", lg: "md" }}
                >
                    <Card.Body p={{ base: 4, lg: 6 }}>
                        <VStack align="stretch" gap={{ base: 3, lg: 4 }}>
                            <HStack gap={2}>
                                <Box color="red.500">
                                    <LuTriangleAlert size={20} />
                                </Box>
                                <Text
                                    fontWeight="semibold"
                                    fontSize={{ base: "sm", lg: "md" }}
                                >
                                    {t("agent.errorDetails")}
                                </Text>
                            </HStack>
                            <Box
                                bg="red.100"
                                _dark={{ bg: "red.900/40", color: "red.200" }}
                                p={{ base: 3, lg: 4 }}
                                rounded="lg"
                                fontFamily="mono"
                                fontSize={{ base: "sm", lg: "md" }}
                                color="red.700"
                                wordBreak="break-word"
                            >
                                {error || t("agent.unknownError")}
                            </Box>
                        </VStack>
                    </Card.Body>
                </Card.Root>

                <HStack justify="center" gap={{ base: 3, lg: 4 }}>
                    <Button
                        variant="outline"
                        onClick={onReset}
                        size={{ base: "lg", lg: "lg" }}
                    >
                        <LuArrowLeft />
                        {t("agent.startOver")}
                    </Button>
                    <Button
                        colorPalette="floorp"
                        onClick={onRetry}
                        size={{ base: "lg", lg: "lg" }}
                    >
                        <LuRefreshCw />
                        {t("agent.retry")}
                    </Button>
                </HStack>
            </VStack>
        </Flex>
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
            {/* ヘッダー - モバイルのみ表示（デスクトップはサイドバーで十分） */}
            <Box
                borderBottomWidth="1px"
                px={3}
                py={2}
                bg="bg.panel"
                flexShrink={0}
                display={{ base: "block", lg: "none" }}
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
            <Flex
                flex={1}
                minH={0}
                overflow={currentStep === "confirm" ? "hidden" : "auto"}
                px={{ base: 4, md: 6, lg: 10 }}
                py={{ base: 4, md: 6, lg: 8 }}
                direction="column"
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
            </Flex>
        </Flex>
    );
}
