/**
 * @fileoverview Idleステップ - ダッシュボード表示
 *
 * ユーザーがAgentを開始する前のダッシュボード状態
 * クイックアクション、入力バーを表示
 * 入力時にワークフロー検索結果を表示
 *
 * @module pages/agent/components/IdleStep
 */

import React from "react";
import {
    Badge,
    Box,
    Button,
    Card,
    Flex,
    HStack,
    IconButton,
    Spinner,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
    LuArrowUp,
    LuClock,
    LuPackage,
    LuSettings,
    LuSparkles,
    LuWrench,
} from "react-icons/lu";
import { useWorkflowsList } from "@/pages/workflows/useWorkflowsList";
import { useI18n } from "@/hooks/useI18n";
import { formatRelativeTimestamp } from "@/lib/time-utils";

interface IdleStepProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    generating: boolean;
}

export function IdleStep({
    prompt,
    onPromptChange,
    onSubmit,
    generating,
}: IdleStepProps) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // ワークフロー一覧を取得
    const { workflows, loading } = useWorkflowsList();

    // 最新順にソート（updatedAtの降順）
    const sortedWorkflows = React.useMemo(() => {
        return [...workflows].sort((a, b) => {
            const aTime = a.updatedAt?.seconds ?? a.createdAt?.seconds ??
                BigInt(0);
            const bTime = b.updatedAt?.seconds ?? b.createdAt?.seconds ??
                BigInt(0);
            return Number(bTime - aTime);
        });
    }, [workflows]);

    // プロンプト入力に基づいてフィルタリング
    const filteredWorkflows = React.useMemo(() => {
        if (!prompt.trim()) return sortedWorkflows;
        const query = prompt.toLowerCase();
        return sortedWorkflows.filter((w) => {
            const name = (w.displayName || "").toLowerCase();
            const desc = (w.description || "").toLowerCase();
            return name.includes(query) || desc.includes(query);
        });
    }, [sortedWorkflows, prompt]);

    // 表示するワークフロー数を制限（最大6件）
    const displayWorkflows = React.useMemo(() => {
        return filteredWorkflows.slice(0, 6);
    }, [filteredWorkflows]);

    const hasWorkflows = workflows.length > 0;
    const hasMoreWorkflows = filteredWorkflows.length > 6;
    const isSearching = prompt.trim().length > 0;

    // Auto-resize textarea
    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [prompt]);

    // Cmd/Ctrl + Enter で送信
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <Flex
            direction="column"
            w="full"
            h="full"
            px={{ base: 4, md: 6 }}
        >
            {/* 上部エリア - スクロール可能、ウェルカム+クイックアクション or 検索結果 */}
            <Box
                flex="1"
                minH={0}
                overflowY="auto"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Box w="full" maxW="3xl">
                    {/* ウェルカム + クイックアクション - 入力がない時のみ表示 */}
                    {!isSearching && (
                        <VStack gap={6} textAlign="center" py={8}>
                            <VStack gap={2}>
                                <Text
                                    fontSize={{
                                        base: "2xl",
                                        md: "3xl",
                                        lg: "4xl",
                                    }}
                                    fontWeight="normal"
                                    color="fg"
                                    letterSpacing="-0.02em"
                                >
                                    {t("home.title")}
                                </Text>
                                <Text
                                    color="fg.muted"
                                    fontSize={{ base: "sm", md: "md" }}
                                >
                                    {t("home.subtitle")}
                                </Text>
                            </VStack>

                            <HStack
                                gap={2}
                                justify="center"
                                flexWrap="wrap"
                                w="full"
                            >
                                <Button
                                    onClick={() => navigate("/generate")}
                                    variant="outline"
                                    size="sm"
                                    borderRadius="full"
                                    fontWeight="normal"
                                    bg="bg"
                                    borderColor="border"
                                    color="fg.muted"
                                    _hover={{
                                        bg: "bg.muted",
                                        color: "fg",
                                        borderColor: "border.emphasized",
                                    }}
                                >
                                    <LuSparkles size={14} />
                                    <Text fontSize="sm">
                                        {t("common.generate")}
                                    </Text>
                                </Button>
                                <Button
                                    onClick={() => navigate("/workflows")}
                                    variant="outline"
                                    size="sm"
                                    borderRadius="full"
                                    fontWeight="normal"
                                    bg="bg"
                                    borderColor="border"
                                    color="fg.muted"
                                    _hover={{
                                        bg: "bg.muted",
                                        color: "fg",
                                        borderColor: "border.emphasized",
                                    }}
                                >
                                    <LuWrench size={14} />
                                    <Text fontSize="sm">
                                        {t("common.workflows")}
                                    </Text>
                                </Button>
                                <Button
                                    onClick={() => navigate("/plugins")}
                                    variant="outline"
                                    size="sm"
                                    borderRadius="full"
                                    fontWeight="normal"
                                    bg="bg"
                                    borderColor="border"
                                    color="fg.muted"
                                    _hover={{
                                        bg: "bg.muted",
                                        color: "fg",
                                        borderColor: "border.emphasized",
                                    }}
                                >
                                    <LuPackage size={14} />
                                    <Text fontSize="sm">
                                        {t("common.plugins")}
                                    </Text>
                                </Button>
                                <Button
                                    onClick={() => navigate("/settings")}
                                    variant="outline"
                                    size="sm"
                                    borderRadius="full"
                                    fontWeight="normal"
                                    bg="bg"
                                    borderColor="border"
                                    color="fg.muted"
                                    _hover={{
                                        bg: "bg.muted",
                                        color: "fg",
                                        borderColor: "border.emphasized",
                                    }}
                                >
                                    <LuSettings size={14} />
                                    <Text fontSize="sm">
                                        {t("common.settings")}
                                    </Text>
                                </Button>
                            </HStack>
                        </VStack>
                    )}

                    {/* 類似するワークフロー - 入力時のみ表示 */}
                    {isSearching && (
                        <VStack gap={2} w="full" py={4}>
                            <HStack justify="space-between" w="full" px={1}>
                                <Text
                                    fontSize="sm"
                                    color="fg.muted"
                                    fontWeight="medium"
                                >
                                    {t("common.similarWorkflows")}{" "}
                                    ({filteredWorkflows.length})
                                </Text>
                                {hasMoreWorkflows && (
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="fg.muted"
                                        fontSize="xs"
                                        h="auto"
                                        py={0}
                                        onClick={() => navigate("/workflows")}
                                    >
                                        {t("common.viewAll")}
                                    </Button>
                                )}
                            </HStack>
                            {hasWorkflows && !loading &&
                                displayWorkflows.map((workflow) => {
                                    const latestResult = workflow
                                        .workflowResults?.[
                                            workflow.workflowResults.length - 1
                                        ];
                                    const latestCode = workflow.workflowCode?.[
                                        workflow.workflowCode.length - 1
                                    ];
                                    const hasResult =
                                        latestResult !== undefined;
                                    const isSuccess =
                                        latestResult?.resultType === 0;

                                    return (
                                        <Card.Root
                                            key={workflow.id}
                                            w="full"
                                            cursor="pointer"
                                            borderRadius="xl"
                                            _hover={{
                                                borderColor: "floorp.300",
                                                _dark: {
                                                    borderColor: "floorp.700",
                                                },
                                            }}
                                            onClick={() =>
                                                navigate(
                                                    `/workflows/${workflow.id}`,
                                                )}
                                        >
                                            <Card.Body p={3}>
                                                <VStack
                                                    align="stretch"
                                                    gap={1.5}
                                                >
                                                    <Text
                                                        fontWeight="semibold"
                                                        fontSize="sm"
                                                        lineClamp={1}
                                                    >
                                                        {workflow.displayName ||
                                                            t("common.untitledWorkflow")}
                                                    </Text>
                                                    {workflow.description && (
                                                        <Text
                                                            fontSize="xs"
                                                            color="fg.muted"
                                                            lineClamp={2}
                                                        >
                                                            {workflow
                                                                .description}
                                                        </Text>
                                                    )}
                                                    <HStack
                                                        gap={2}
                                                        flexWrap="wrap"
                                                        fontSize="xs"
                                                        color="fg.muted"
                                                    >
                                                        {workflow.updatedAt && (
                                                            <HStack gap={1}>
                                                                <LuClock
                                                                    size={10}
                                                                />
                                                                <Text fontSize="2xs">
                                                                    {formatRelativeTimestamp(
                                                                        workflow
                                                                            .updatedAt,
                                                                        t,
                                                                    )}
                                                                </Text>
                                                            </HStack>
                                                        )}
                                                        {hasResult && (
                                                            <Badge
                                                                colorPalette={isSuccess
                                                                    ? "green"
                                                                    : "red"}
                                                                size="xs"
                                                                fontSize="2xs"
                                                            >
                                                                {isSuccess
                                                                    ? t("common.success")
                                                                    : t("common.failure")}
                                                            </Badge>
                                                        )}
                                                        {!hasResult &&
                                                            latestCode && (
                                                            <Badge
                                                                colorPalette="gray"
                                                                size="xs"
                                                                fontSize="2xs"
                                                            >
                                                                {t("common.neverRun")}
                                                            </Badge>
                                                        )}
                                                    </HStack>
                                                </VStack>
                                            </Card.Body>
                                        </Card.Root>
                                    );
                                })}
                            {(!hasWorkflows || displayWorkflows.length === 0) &&
                                (
                                    <Text
                                        fontSize="sm"
                                        color="fg.muted"
                                        py={4}
                                        textAlign="center"
                                    >
                                        {t("common.noResults")}
                                    </Text>
                                )}
                        </VStack>
                    )}
                </Box>
            </Box>

            {/* 下部固定エリア - 入力ボックス */}
            <Box
                w="full"
                maxW="3xl"
                mx="auto"
                flexShrink={0}
                py={4}
            >
                <Box
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="2xl"
                    bg="bg"
                    transition="all 0.2s"
                    _focusWithin={{
                        borderColor: "fg.muted",
                        boxShadow: "0 0 0 1px var(--chakra-colors-border)",
                    }}
                    overflow="hidden"
                >
                    <Textarea
                        ref={textareaRef}
                        placeholder={t("agent.placeholder")}
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        minH="100px"
                        maxH="200px"
                        fontSize={{ base: "md", lg: "lg" }}
                        resize="none"
                        disabled={generating}
                        border="none"
                        borderRadius="none"
                        px={5}
                        pt={5}
                        pb={2}
                        _focus={{
                            boxShadow: "none",
                            outline: "none",
                        }}
                        _placeholder={{
                            color: "fg.muted",
                        }}
                    />

                    {/* Bottom toolbar */}
                    <Flex justify="space-between" align="center" px={4} py={3}>
                        <Text fontSize="xs" color="fg.muted">
                            {t("agent.sendHint")}
                        </Text>

                        <IconButton
                            aria-label={t("agent.generateWorkflow")}
                            onClick={onSubmit}
                            disabled={!prompt.trim() || generating}
                            size="sm"
                            borderRadius="lg"
                            colorPalette="floorp"
                            _disabled={{
                                opacity: 0.5,
                                cursor: "not-allowed",
                            }}
                        >
                            {generating ? <Spinner size="sm" /> : <LuArrowUp />}
                        </IconButton>
                    </Flex>
                </Box>
            </Box>
        </Flex>
    );
}
