import React from "react";
import {
    Box,
    Button,
    Card,
    Flex,
    Heading,
    HStack,
    Separator,
    Spinner,
    Tabs,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuHistory, LuPlay } from "react-icons/lu";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WorkflowExecutionTimeline } from "@/components/workflow/WorkflowExecutionTimeline";
import { StreamConsole } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkflow } from "./useWorkflow";
import { useWorkflowRun } from "./useWorkflowRun";
import type { RunEvent } from "@/types/workflow";

import { PermissionList } from "@/components/workflow/PermissionList";
import { useI18n } from "@/hooks/useI18n";

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
        <Flex h="full" gap={4} overflow="hidden">
            {/* Left Side: Execution Panel */}
            <VStack
                flex="1"
                align="stretch"
                gap={1}
                p={{ base: 1.5, md: 2 }}
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
                        fontSize={{ base: "sm", md: "md" }}
                    >
                        {t("run.title")}
                    </Text>
                    <HStack gap={2}>
                        <Text
                            fontSize="xs"
                            color={running
                                ? "blue.500"
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
                            size="sm"
                            onClick={onRun}
                            disabled={!workflow || running}
                            minH={{ base: "36px", md: "auto" }}
                            colorPalette="floorp"
                        >
                            <LuPlay size={14} />
                            <Text fontSize={{ base: "xs", sm: "sm" }}>
                                {t("run.title")}
                            </Text>
                        </Button>
                    </HStack>
                </HStack>
                <Separator my={{ base: 1, md: 2 }} />
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
                            <StreamConsole
                                events={events as GenerationEvent[]}
                                streaming={running}
                            />
                        )}
                </Box>
            </VStack>

            {/* Right Side: Permissions Panel */}
            <Box
                w="320px"
                borderWidth="1px"
                rounded="md"
                bg="bg"
                p={4}
                overflowY="auto"
                display={{ base: "none", xl: "block" }}
            >
                <Heading size="sm" mb={4}>
                    {t("workflowView.requiredPermissions")}
                </Heading>
                {latestCode?.allowedPermissions
                    ? (
                        <PermissionList
                            permissions={latestCode.allowedPermissions}
                        />
                    )
                    : (
                        <Text fontSize="sm" color="fg.muted">
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

    // 自動実行フラグを取得
    const shouldAutoRun = React.useMemo(() => {
        const state = location.state as { autoRun?: boolean } | null;
        return state?.autoRun === true;
    }, [location.state]);

    // 自動実行が有効で、ワークフローが読み込まれたら実行
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
            clearEvents();
            const latestCodeId = workflow
                .workflowCode[workflow.workflowCode.length - 1]?.id;
            runById(workflow.id, latestCodeId, workflow);
        }
    }, [shouldAutoRun, workflow, loading, running, runById, clearEvents]);

    const latestCode = React.useMemo(() => {
        if (!workflow?.workflowCode || workflow.workflowCode.length === 0) {
            return null;
        }
        return workflow.workflowCode[workflow.workflowCode.length - 1];
    }, [workflow]);

    const handleRun = React.useCallback(() => {
        if (!workflow) return;
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
        <Flex direction="column" h="full" overflow="hidden">
            {/* Header */}
            <Box
                borderBottomWidth="1px"
                borderBottomColor="border"
                px={{ base: 4, md: 6 }}
                py={3}
                bg="bg.panel"
                zIndex={10}
            >
                <HStack justify="space-between" align="center">
                    <HStack gap={3}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(backPath)}
                        >
                            <LuArrowLeft />
                        </Button>
                        <VStack align="start" gap={0}>
                            <Heading size="md">
                                {workflow.displayName ||
                                    t("common.untitledWorkflow")} -{" "}
                                {t("run.title")}
                            </Heading>
                            {workflow.description && (
                                <Text fontSize="sm" color="fg.muted">
                                    {workflow.description}
                                </Text>
                            )}
                        </VStack>
                    </HStack>
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
                        <Tabs.List borderBottomWidth="1px" flexShrink={0}>
                            <Tabs.Trigger value="workflow" px={4} py={2}>
                                <Text fontSize="sm">
                                    {t("workflowView.workflow")}
                                </Text>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="run" px={4} py={2}>
                                <Text fontSize="sm">{t("run.title")}</Text>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="history" px={4} py={2}>
                                <HStack gap={1}>
                                    <LuHistory size={14} />
                                    <Text fontSize="sm">
                                        {t("workflowView.executionHistory")}
                                    </Text>
                                    {workflow.workflowResults &&
                                        workflow.workflowResults.length > 0 && (
                                        <Box
                                            as="span"
                                            px={1.5}
                                            py={0.5}
                                            rounded="full"
                                            bg="blue.500"
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
                            <Box h="full" overflow="auto" p={4}>
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
                            p={4}
                        >
                            <RunPanel
                                running={running}
                                events={events}
                                workflow={workflow}
                                runRes={runRes}
                                onRun={handleRun}
                                latestCode={latestCode}
                            />
                        </Tabs.Content>

                        <Tabs.Content
                            value="history"
                            flex="1"
                            overflow="auto"
                            p={4}
                        >
                            <WorkflowExecutionTimeline
                                results={workflow.workflowResults || []}
                            />
                        </Tabs.Content>
                    </Tabs.Root>
                </Box>
            </Flex>
        </Flex>
    );
}
