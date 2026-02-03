/**
 * @fileoverview 権限確認ステップ - Claude風デザイン
 *
 * シンプルで控えめな確認UI
 *
 * @module pages/agent/components/ConfirmStep
 */

import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Flex,
    HStack,
    IconButton,
    Spinner,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import { LuArrowUp, LuPlay, LuZap } from "react-icons/lu";
import {
    hasHighRiskFunctions,
    WorkflowCanvas,
    WorkflowFunctionList,
} from "@/components/workflow";
import { useI18n } from "@/hooks/useI18n";
import type { UseAgentExecutionReturn } from "../useAgentExecution";

interface ConfirmStepProps {
    workflow: UseAgentExecutionReturn["generatedWorkflow"];
    onConfirm: () => void;
    onRefine: (prompt: string) => void;
    saving: boolean;
    refining: boolean;
}

export function ConfirmStep({
    workflow,
    onConfirm,
    onRefine,
    saving,
    refining,
}: ConfirmStepProps) {
    const { t } = useI18n();
    const [riskAcknowledged, setRiskAcknowledged] = React.useState(false);
    const [refinePrompt, setRefinePrompt] = React.useState("");
    const [showDetailView, setShowDetailView] = React.useState(false);
    const refineTextareaRef = React.useRef<HTMLTextAreaElement>(null);

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
            gap={4}
            maxW="4xl"
            mx="auto"
        >
            {/* シンプルなヘッダー */}
            <VStack gap={1} textAlign="center" pt={4}>
                <Text fontSize="xl" fontWeight="normal" color="fg">
                    {t("agent.confirmTitle")}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                    {t("agent.confirmHint")}
                </Text>
            </VStack>

            {/* ワークフロー表示 - シンプルなボーダー */}
            {hasWorkflowDefinition && (
                <Box
                    flex={1}
                    minH={{ base: "150px", md: "200px" }}
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="xl"
                    bg="bg"
                >
                    <Flex
                        justify="space-between"
                        align="center"
                        px={{ base: 3, md: 4 }}
                        py={{ base: 2, md: 2 }}
                        borderBottomWidth="1px"
                        borderColor="border"
                    >
                        <HStack gap={2}>
                            <LuZap size={14} />
                            <Text fontWeight="medium" fontSize="xs" color="fg.muted">
                                {t("agent.workflowSteps")}
                            </Text>
                        </HStack>
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setShowDetailView(!showDetailView)}
                            color="fg.muted"
                            borderRadius="lg"
                            fontSize="xs"
                        >
                            {showDetailView
                                ? t("agent.compactView")
                                : t("agent.detailView")}
                        </Button>
                    </Flex>
                    <Box overflow="auto" flex={1} minH="0" maxH={{ base: "calc(100vh - 480px)", md: "400px" }}>
                        {workflow?.workflowDefinition &&
                            (showDetailView
                                ? (
                                    <WorkflowCanvas
                                        workflow={workflow.workflowDefinition}
                                        withBackground={false}
                                    />
                                )
                                : (
                                    <Box p={4}>
                                        <WorkflowFunctionList
                                            workflow={workflow.workflowDefinition}
                                        />
                                    </Box>
                                ))}
                    </Box>
                </Box>
            )}

            {/* フッター: アクションと修正チャット */}
            <Box
                flexShrink={0}
                p={{ base: 3, md: 4 }}
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg"
            >
                <VStack gap={{ base: 2, md: 4 }} align="stretch">
                    {/* 高リスク承認 + 実行ボタン */}
                    <Flex
                        direction="row"
                        gap={{ base: 2, md: 3 }}
                        align="center"
                    >
                        {hasHighRisk && (
                            <HStack
                                gap={{ base: 2, md: 3 }}
                                align="center"
                                px={{ base: 2, md: 4 }}
                                py={{ base: 2, md: 3 }}
                                rounded="xl"
                                bg="bg.muted"
                                flex={1}
                            >
                                <Checkbox.Root
                                    checked={riskAcknowledged}
                                    onCheckedChange={(e) =>
                                        setRiskAcknowledged(!!e.checked)}
                                    size="md"
                                >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                </Checkbox.Root>
                                <Text fontSize={{ base: "xs", md: "sm" }} color="fg.muted">
                                    {t("agent.highRiskAcknowledge")}
                                </Text>
                            </HStack>
                        )}
                        <Button
                            onClick={onConfirm}
                            disabled={saving || !canConfirm}
                            size={{ base: "sm", md: "md" }}
                            px={{ base: 4, md: 6 }}
                            flexShrink={0}
                            borderRadius="lg"
                            colorPalette="floorp"
                            ml={hasHighRisk ? 0 : "auto"}
                            _disabled={{
                                opacity: 0.5,
                                cursor: "not-allowed",
                            }}
                        >
                            {saving ? <Spinner size="sm" /> : (
                                <>
                                    <LuPlay size={16} />
                                    <Text ml={1}>{t("agent.confirmAndRun")}</Text>
                                </>
                            )}
                        </Button>
                    </Flex>

                    {/* 修正チャットボックス - 2行サイズ */}
                    <Flex
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="xl"
                        bg="bg"
                        overflow="hidden"
                        align="center"
                        gap={2}
                        px={{ base: 2, md: 3 }}
                        _focusWithin={{
                            borderColor: "fg.muted",
                        }}
                    >
                        <Textarea
                            ref={refineTextareaRef}
                            placeholder={t("agent.refinePlaceholder")}
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            disabled={saving || refining}
                            resize="none"
                            rows={2}
                            minH="unset"
                            maxH="unset"
                            py={2}
                            px={2}
                            fontSize={{ base: "sm", md: "md" }}
                            border="none"
                            flex={1}
                            _focus={{
                                boxShadow: "none",
                                outline: "none",
                            }}
                            _placeholder={{
                                color: "fg.muted",
                            }}
                            onKeyDown={(e) => {
                                if (e.nativeEvent.isComposing) return;
                                if (e.key === "Enter" && !e.shiftKey && refinePrompt.trim()) {
                                    e.preventDefault();
                                    onRefine(refinePrompt.trim());
                                    setRefinePrompt("");
                                }
                            }}
                        />
                        <IconButton
                            aria-label={t("agent.refine")}
                            size="sm"
                            borderRadius="lg"
                            disabled={!refinePrompt.trim() || saving || refining}
                            onClick={() => {
                                if (refinePrompt.trim()) {
                                    onRefine(refinePrompt.trim());
                                    setRefinePrompt("");
                                }
                            }}
                            bg={refinePrompt.trim() ? "fg" : "bg.muted"}
                            color={refinePrompt.trim() ? "bg" : "fg.muted"}
                            _hover={{
                                bg: refinePrompt.trim() ? "fg.muted" : "bg.muted",
                            }}
                            _disabled={{
                                bg: "bg.muted",
                                color: "fg.muted",
                                cursor: "not-allowed",
                                opacity: 0.5,
                            }}
                        >
                            {refining ? <Spinner size="sm" /> : <LuArrowUp size={16} />}
                        </IconButton>
                    </Flex>
                </VStack>
            </Box>
        </Flex>
    );
}
