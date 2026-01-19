import React from "react";
import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Dialog,
    Flex,
    Heading,
    HStack,
    IconButton,
    Separator,
    Spinner,
    Tabs,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuHistory, LuPlay, LuRefreshCw, LuShield } from "react-icons/lu";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WorkflowFunctionList } from "@/components/workflow/WorkflowFunctionList";
import { WorkflowExecutionTimeline } from "@/components/workflow/WorkflowExecutionTimeline";
import { TerminalConsole } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkflow } from "./useWorkflow";
import { useWorkflowRun } from "./useWorkflowRun";
import type { RunEvent } from "@/types/workflow";

import { PermissionList } from "@/components/workflow/PermissionList";
import { useI18n } from "@/hooks/useI18n";
import { PermissionLevel } from "@/gen/sapphillon/v1/permission_pb";

/**
 * 実行確認ダイアログ
 */
function RunConfirmDialog({
    open,
    onClose,
    onConfirm,
    workflow,
    latestCode,
    running,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    workflow: React.ComponentProps<typeof WorkflowCanvas>["workflow"] | null;
    latestCode: React.ComponentProps<typeof WorkflowCanvas>["workflow"]["workflowCode"][0] | null;
    running: boolean;
}) {
    const { t } = useI18n();
    const [riskAcknowledged, setRiskAcknowledged] = React.useState(false);
    const [showDetailView, setShowDetailView] = React.useState(false);

    // リセット
    React.useEffect(() => {
        if (open) {
            setRiskAcknowledged(false);
            setShowDetailView(false);
        }
    }, [open]);

    const permissions = latestCode?.allowedPermissions || [];
    const hasPermissions = permissions.length > 0;

    // 高リスク操作の検出
    const highRiskCount = React.useMemo(() => {
        if (!latestCode?.pluginPackages) return 0;
        let count = 0;
        for (const pkg of latestCode.pluginPackages) {
            for (const func of pkg.functions) {
                for (const perm of func.permissions) {
                    if (
                        perm.permissionLevel === PermissionLevel.HIGH ||
                        perm.permissionLevel === PermissionLevel.CRITICAL
                    ) {
                        count++;
                        break;
                    }
                }
            }
        }
        return count;
    }, [latestCode]);

    const hasHighRisk = highRiskCount > 0;
    const canConfirm = !hasHighRisk || riskAcknowledged;

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content maxW="600px" maxH="80vh" overflow="hidden">
                    <Dialog.Header>
                        <HStack gap={2}>
                            <Box
                                p={1.5}
                                rounded="md"
                                bg="orange.100"
                                _dark={{ bg: "orange.900/30" }}
                            >
                                <LuShield size={16} color="var(--chakra-colors-orange-500)" />
                            </Box>
                            <Heading size="sm">{t("run.confirmTitle")}</Heading>
                        </HStack>
                    </Dialog.Header>
                    <Dialog.CloseTrigger />
                    <Dialog.Body overflow="auto">
                        <VStack align="stretch" gap={3}>
                            {/* ワークフロー名 */}
                            <Box>
                                <Text fontWeight="medium" fontSize="sm">
                                    {workflow?.displayName || t("common.untitledWorkflow")}
                                </Text>
                                {workflow?.description && (
                                    <Text fontSize="xs" color="fg.muted">
                                        {workflow.description}
                                    </Text>
                                )}
                            </Box>

                            {/* 必要な権限 */}
                            {hasPermissions && (
                                <Card.Root
                                    bg="orange.50"
                                    _dark={{
                                        bg: "orange.900/20",
                                        borderColor: "orange.800",
                                    }}
                                    borderWidth="1px"
                                    borderColor="orange.200"
                                >
                                    <Card.Body p={3}>
                                        <VStack align="stretch" gap={2}>
                                            <HStack justify="space-between">
                                                <HStack gap={2}>
                                                    <LuShield size={14} color="var(--chakra-colors-orange-500)" />
                                                    <Text fontWeight="medium" fontSize="sm">
                                                        {t("agent.requiredPermissions")}
                                                    </Text>
                                                </HStack>
                                                <Badge
                                                    colorPalette={permissions.length > 3 ? "orange" : "blue"}
                                                    size="xs"
                                                >
                                                    {permissions.length} {t("agent.permissionCount")}
                                                </Badge>
                                            </HStack>
                                            <PermissionList permissions={permissions} />
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            )}

                            {/* ワークフローステップ */}
                            {workflow && (
                                <Card.Root maxH="200px" overflow="hidden">
                                    <Card.Body p={0} display="flex" flexDirection="column">
                                        <HStack
                                            px={3}
                                            py={2}
                                            borderBottomWidth="1px"
                                            justify="space-between"
                                        >
                                            <Text fontWeight="medium" fontSize="sm">
                                                {t("agent.workflowSteps")}
                                            </Text>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => setShowDetailView(!showDetailView)}
                                                fontSize="xs"
                                            >
                                                {showDetailView ? t("agent.compactView") : t("agent.detailView")}
                                            </Button>
                                        </HStack>
                                        <Box flex={1} overflow="auto">
                                            {showDetailView ? (
                                                <WorkflowCanvas workflow={workflow} withBackground={false} />
                                            ) : (
                                                <Box p={2}>
                                                    <WorkflowFunctionList workflow={workflow} />
                                                </Box>
                                            )}
                                        </Box>
                                    </Card.Body>
                                </Card.Root>
                            )}

                            {/* 高リスク確認 */}
                            {hasHighRisk && (
                                <HStack
                                    gap={2}
                                    align="center"
                                    px={2}
                                    py={2}
                                    rounded="md"
                                    bg="red.50"
                                    borderWidth="1px"
                                    borderColor={riskAcknowledged ? "green.400" : "red.300"}
                                    _dark={{
                                        bg: "red.950/50",
                                        borderColor: riskAcknowledged ? "green.600" : "red.700",
                                    }}
                                >
                                    <Checkbox.Root
                                        checked={riskAcknowledged}
                                        onCheckedChange={(e) => setRiskAcknowledged(!!e.checked)}
                                        colorPalette="green"
                                        size="sm"
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                    </Checkbox.Root>
                                    <Text fontSize="xs" color="red.700" _dark={{ color: "red.300" }}>
                                        {t("agent.highRiskAcknowledge")}
                                    </Text>
                                </HStack>
                            )}
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <HStack gap={2}>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                {t("common.cancel")}
                            </Button>
                            <Button
                                colorPalette={canConfirm ? "floorp" : "gray"}
                                size="sm"
                                onClick={onConfirm}
                                disabled={running || !canConfirm}
                            >
                                {running ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <LuPlay size={14} />
                                        {t("run.title")}
                                    </>
                                )}
                            </Button>
                        </HStack>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

function RunPanel({
    running,
    events,
    workflow,
    runRes,
    onRun,
    latestCode,
}: {
    running: boolean;
    events: RunEvent[];
    workflow: React.ComponentProps<typeof WorkflowCanvas>["workflow"] | null;
    runRes: ReturnType<typeof useWorkflowRun>["runRes"];
    onRun: () => void;
    latestCode:
        | React.ComponentProps<
            typeof WorkflowCanvas
        >["workflow"]["workflowCode"][0]
        | null;
}) {
    const { t } = useI18n();
    return (
        <Flex h="full" gap={3} overflow="hidden">
            {/* Left Side: Execution Panel */}
            <VStack
                flex="1"
                align="stretch"
                gap={1}
                p={2}
                borderWidth="1px"
                bg="bg"
                rounded="md"
                h="full"
                minH={0}
                display="grid"
                gridTemplateRows="auto minmax(0, 1fr)"
                overflow="hidden"
            >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Text
                        fontWeight="medium"
                        fontSize="sm"
                    >
                        {t("run.title")}
                    </Text>
                    <HStack gap={2}>
                        <Text
                            fontSize="xs"
                            color={running
                                ? "floorp.500"
                                : runRes
                                ? "green.500"
                                : "fg.muted"}
                            fontWeight="medium"
                        >
                            {running
                                ? t("run.running")
                                : runRes
                                ? t("run.completed")
                                : t("run.waiting")}
                        </Text>
                        <Button
                            size="xs"
                            onClick={onRun}
                            disabled={!workflow || running}
                            colorPalette="floorp"
                        >
                            <LuPlay size={14} />
                            <Text fontSize="xs">
                                {t("run.title")}
                            </Text>
                        </Button>
                    </HStack>
                </HStack>
                <Separator my={1} />
                <Box minH={0} h="full" overflow="hidden">
                    {events.length === 0 && !running && !runRes
                        ? (
                            <EmptyState
                                icon={<LuPlay />}
                                title={t("run.notExecuted")}
                                description={t("run.notExecutedDescription")}
                            />
                        )
                        : (
                            <TerminalConsole
                                events={events as GenerationEvent[]}
                                streaming={running}
                            />
                        )}
                </Box>
            </VStack>

            {/* Right Side: Permissions Panel */}
            <Box
                w="280px"
                borderWidth="1px"
                rounded="md"
                bg="bg"
                p={3}
                overflowY="auto"
                display={{ base: "none", xl: "block" }}
            >
                <Heading size="xs" mb={3}>
                    {t("workflowView.requiredPermissions")}
                </Heading>
                {latestCode?.allowedPermissions
                    ? (
                        <PermissionList
                            permissions={latestCode.allowedPermissions}
                        />
                    )
                    : (
                        <Text fontSize="xs" color="fg.muted">
                            {t("workflowView.noPermissionInfo")}
                        </Text>
                    )}
            </Box>
        </Flex>
    );
}

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
