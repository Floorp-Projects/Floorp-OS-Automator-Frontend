import React from "react";
import {
    Box,
    Button,
    Card,
    Flex,
    Heading,
    HStack,
    IconButton,
    Spinner,
    Tabs,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuHistory, LuRefreshCw } from "react-icons/lu";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WorkflowExecutionTimeline } from "@/components/workflow/WorkflowExecutionTimeline";
import { useWorkflow } from "./useWorkflow";
import { useWorkflowRun } from "./useWorkflowRun";
import { RunConfirmDialog } from "./RunConfirmDialog";
import { RunPanel } from "./RunPanel";
import { useI18n } from "@/hooks/useI18n";

// Extracted components: RunConfirmDialog, RunPanel

export function WorkflowRunPage() {
    const { t } = useI18n();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { workflow, loading, error } = useWorkflow(id || "");
    const { running, events, runRes, runById, clearEvents } = useWorkflowRun();
    const [activeTab, setActiveTab] = React.useState<
        "workflow" | "run" | "history"
    >("run");
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

    // 戻る先を決定（Home から来た場合は Home に戻る）
    const backPath = React.useMemo(() => {
        const state = location.state as
            | { from?: string; autoRun?: boolean }
            | null;
        if (state?.from === "/home") {
            return "/home";
        }
        return "/workflows";
    }, [location.state]);

    // 自動実行フラグを取得 → 確認ダイアログを開く
    const shouldAutoRun = React.useMemo(() => {
        const state = location.state as { autoRun?: boolean } | null;
        return state?.autoRun === true;
    }, [location.state]);

    // 自動実行が有効で、ワークフローが読み込まれたら確認ダイアログを開く
    const hasAutoRunRef = React.useRef(false);
    React.useEffect(() => {
        if (
            shouldAutoRun &&
            !hasAutoRunRef.current &&
            workflow &&
            !loading &&
            !running &&
            workflow.workflowCode &&
            workflow.workflowCode.length > 0
        ) {
            hasAutoRunRef.current = true;
            setConfirmDialogOpen(true);
        }
    }, [shouldAutoRun, workflow, loading, running]);

    const latestCode = React.useMemo(() => {
        if (!workflow?.workflowCode || workflow.workflowCode.length === 0) {
            return null;
        }
        return workflow.workflowCode[workflow.workflowCode.length - 1];
    }, [workflow]);

    // 確認ダイアログを開く
    const handleOpenConfirm = React.useCallback(() => {
        if (!workflow) return;
        setConfirmDialogOpen(true);
    }, [workflow]);

    // 実行を実行
    const handleConfirmRun = React.useCallback(() => {
        if (!workflow) return;
        setConfirmDialogOpen(false);
        clearEvents();
        const latestCodeId = workflow.workflowCode
            ?.[workflow.workflowCode.length - 1]?.id;
        runById(workflow.id, latestCodeId, workflow);
    }, [workflow, runById, clearEvents]);

    if (loading) {
        return (
            <Flex h="full" align="center" justify="center">
                <VStack gap={4}>
                    <Spinner size="lg" />
                    <Text color="fg.muted">{t("workflowView.loading")}</Text>
                </VStack>
            </Flex>
        );
    }

    if (error || !workflow) {
        return (
            <Flex h="full" align="center" justify="center">
                <Card.Root>
                    <Card.Body>
                        <VStack gap={4}>
                            <Text color="red.500" fontWeight="medium">
                                {t("workflowView.errorLoading")}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                                {error instanceof Error
                                    ? error.message
                                    : String(error)}
                            </Text>
                            <Button onClick={() => navigate("/workflows")}>
                                {t("workflowView.backToWorkflows")}
                            </Button>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </Flex>
        );
    }

    return (
        <Flex direction="column" h="full" overflow="hidden" fontSize="md">
            {/* Header - Agentスタイルに統一 */}
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
                            aria-label={t("common.back")}
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate(backPath)}
                        >
                            <LuArrowLeft />
                        </IconButton>
                        <VStack align="start" gap={0}>
                            <Heading size="sm" lineClamp={1}>
                                {workflow.displayName ||
                                    t("common.untitledWorkflow")}
                            </Heading>
                            {workflow.description && (
                                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                                    {workflow.description}
                                </Text>
                            )}
                        </VStack>
                    </HStack>
                    <IconButton
                        aria-label={t("workflows.refresh")}
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenConfirm()}
                        disabled={running}
                    >
                        <LuRefreshCw />
                    </IconButton>
                </HStack>
            </Box>

            {/* Main Content */}
            <Flex flex="1" overflow="hidden">
                <Box flex="1" overflow="hidden" position="relative">
                    <Tabs.Root
                        value={activeTab}
                        onValueChange={(e) =>
                            setActiveTab(
                                e.value as "workflow" | "run" | "history",
                            )}
                        h="full"
                        display="flex"
                        flexDirection="column"
                    >
                        <Tabs.List borderBottomWidth="1px" flexShrink={0} px={2}>
                            <Tabs.Trigger value="workflow" px={3} py={1.5}>
                                <Text fontSize="xs">
                                    {t("workflowView.workflow")}
                                </Text>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="run" px={3} py={1.5}>
                                <Text fontSize="xs">{t("run.title")}</Text>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="history" px={3} py={1.5}>
                                <HStack gap={1}>
                                    <LuHistory size={12} />
                                    <Text fontSize="xs">
                                        {t("workflowView.executionHistory")}
                                    </Text>
                                    {workflow.workflowResults &&
                                        workflow.workflowResults.length > 0 && (
                                        <Box
                                            as="span"
                                            px={1}
                                            py={0.5}
                                            rounded="full"
                                            bg="floorp.500"
                                            color="white"
                                            fontSize="2xs"
                                            fontWeight="medium"
                                        >
                                            {workflow.workflowResults.length}
                                        </Box>
                                    )}
                                </HStack>
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content
                            value="workflow"
                            flex="1"
                            overflow="hidden"
                            p={0}
                        >
                            <Box h="full" overflow="auto" p={3}>
                                <WorkflowCanvas
                                    workflow={workflow}
                                    withBackground={true}
                                />
                            </Box>
                        </Tabs.Content>

                        <Tabs.Content
                            value="run"
                            flex="1"
                            overflow="auto"
                            p={3}
                        >
                            <RunPanel
                                running={running}
                                events={events}
                                workflow={workflow}
                                runRes={runRes}
                                onRun={handleOpenConfirm}
                                latestCode={latestCode}
                            />
                        </Tabs.Content>

                        <Tabs.Content
                            value="history"
                            flex="1"
                            overflow="auto"
                            p={3}
                        >
                            <WorkflowExecutionTimeline
                                results={workflow.workflowResults || []}
                            />
                        </Tabs.Content>
                    </Tabs.Root>
                </Box>
            </Flex>

            {/* 実行確認ダイアログ */}
            <RunConfirmDialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleConfirmRun}
                workflow={workflow}
                latestCode={latestCode}
                running={running}
            />
        </Flex>
    );
}
