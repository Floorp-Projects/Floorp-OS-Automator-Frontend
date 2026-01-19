import React from "react";
import {
    Badge,
    Box,
    Button,
    Card,
    Dialog,
    Flex,
    Heading,
    HStack,
    IconButton,
    Input,
    MenuContent,
    MenuItem,
    MenuPositioner,
    MenuRoot,
    MenuTrigger,
    Portal,
    SimpleGrid,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import {
    LuArrowDown,
    LuArrowLeft,
    LuArrowUp,
    LuClock,
    LuCopy,
    LuEllipsisVertical,
    LuFileText,
    LuPlay,
    LuPlus,
    LuRefreshCw,
    LuSearch,
    LuSparkles,
    LuTrash2,
    LuUpload,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useWorkflowsList } from "./useWorkflowsList";
import { WorkflowCloneDialog } from "./WorkflowCloneDialog";
import { useWorkflowRunState } from "@/contexts/WorkflowRunContext";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import {
    OrderByClauseSchema,
    OrderByDirection,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import { create } from "@bufbuild/protobuf";
import { toaster } from "@/components/ui/toaster-instance";
import { useI18n } from "@/hooks/useI18n";

function formatDate(timestamp?: { seconds: bigint; nanos: number }): string {
    if (!timestamp) return "-";
    const date = new Date(Number(timestamp.seconds) * 1000);
    return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatRelativeTime(
    timestamp: { seconds: bigint; nanos: number },
    t: (key: string, options?: Record<string, unknown>) => string,
): string {
    const now = Date.now();
    const date = Number(timestamp.seconds) * 1000;
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("common.time.justNow");
    if (minutes < 60) {
        return t("common.time.minutesAgo", { count: minutes });
    }
    if (hours < 24) return t("common.time.hoursAgo", { count: hours });
    return t("common.time.daysAgo", { count: days });
}

function WorkflowCard({
    workflow,
    onRun,
    onClone,
    onDelete,
    activeWorkflowId,
}: {
    workflow: Workflow;
    onRun: (id: string) => void;
    onClone: (workflow: Workflow) => void;
    onDelete?: (id: string) => void;
    activeWorkflowId: string | null;
}) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const latestResult = workflow.workflowResults
        ?.[workflow.workflowResults.length - 1];
    const latestCode = workflow.workflowCode
        ?.[workflow.workflowCode.length - 1];

    const isRunning = activeWorkflowId === workflow.id;
    const hasResult = latestResult !== undefined;
    const isSuccess = latestResult?.resultType === 0;

    const handleView = React.useCallback(() => {
        navigate(`/workflows/${workflow.id}`);
    }, [navigate, workflow.id]);

    return (
        <Card.Root
            cursor="pointer"
            _hover={{
                borderColor: "floorp.300",
                shadow: "md",
                _dark: {
                    borderColor: "floorp.700",
                },
            }}
            onClick={handleView}
            transition="all 0.2s"
        >
            <Card.Body p={3}>
                <VStack align="stretch" gap={2}>
                    {/* Header: Name + Actions */}
                    <HStack justify="space-between" align="start" gap={2}>
                        <VStack align="start" gap={0.5} flex="1" minW={0}>
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
                                    {workflow.description}
                                </Text>
                            )}
                        </VStack>
                        <HStack gap={1} flexShrink={0}>
                            <IconButton
                                aria-label={t("workflows.run")}
                                size="xs"
                                colorPalette="floorp"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isRunning) onRun(workflow.id);
                                }}
                                disabled={isRunning || !latestCode}
                            >
                                {isRunning
                                    ? <Spinner size="xs" />
                                    : <LuPlay size={14} />}
                            </IconButton>
                            <MenuRoot>
                                <MenuTrigger asChild>
                                    <IconButton
                                        size="xs"
                                        variant="ghost"
                                        aria-label={t("workflows.moreActions")}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <LuEllipsisVertical size={14} />
                                    </IconButton>
                                </MenuTrigger>
                                <Portal>
                                    <MenuPositioner>
                                        <MenuContent>
                                            <MenuItem
                                                value="clone"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClone(workflow);
                                                }}
                                            >
                                                <LuCopy size={14} />
                                                {t("workflows.clone")}
                                            </MenuItem>
                                            {onDelete && (
                                                <MenuItem
                                                    value="delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(workflow.id);
                                                    }}
                                                    color="red.500"
                                                >
                                                    <LuTrash2 size={14} />
                                                    {t("workflows.delete")}
                                                </MenuItem>
                                            )}
                                        </MenuContent>
                                    </MenuPositioner>
                                </Portal>
                            </MenuRoot>
                        </HStack>
                    </HStack>

                    {/* Metadata */}
                    <HStack
                        gap={2}
                        flexWrap="wrap"
                        fontSize="xs"
                        color="fg.muted"
                    >
                        {workflow.updatedAt && (
                            <HStack gap={1}>
                                <LuClock size={10} />
                                <Text fontSize="2xs">
                                    {formatRelativeTime(workflow.updatedAt, t)}
                                </Text>
                            </HStack>
                        )}
                        {hasResult && (
                            <Badge
                                colorPalette={isSuccess ? "green" : "red"}
                                size="xs"
                                fontSize="2xs"
                            >
                                {isSuccess
                                    ? t("common.success")
                                    : t("common.failure")}
                            </Badge>
                        )}
                        {!hasResult && latestCode && (
                            <Badge colorPalette="gray" size="xs" fontSize="2xs">
                                {t("common.neverRun")}
                            </Badge>
                        )}
                    </HStack>
                </VStack>
            </Card.Body>
        </Card.Root>
    );
}

export function WorkflowsPage() {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = React.useState(
        false,
    );
    const [cloneDialogOpen, setCloneDialogOpen] = React.useState(false);
    const [workflowToClone, setWorkflowToClone] = React.useState<
        Workflow | null
    >(
        null,
    );

    const { activeWorkflowId } = useWorkflowRunState(); // Get active workflow ID

    const {
        workflows,
        loading,
        error,
        pageToken,
        nextPageToken,
        filter,
        setFilter,
        orderBy,
        setOrderBy,
        refetch,
        loadNextPage,
    } = useWorkflowsList();

    const handleSearch = React.useCallback(
        (value: string) => {
            setFilter((prev) => ({
                ...prev,
                displayName: value,
            }));
        },
        [setFilter],
    );

    // 複製ハンドラー
    const handleClone = React.useCallback((workflow: Workflow) => {
        setWorkflowToClone(workflow);
        setCloneDialogOpen(true);
    }, []);

    // 複製成功時のハンドラー
    const handleCloneSuccess = React.useCallback(
        (clonedWorkflow: Workflow) => {
            toaster.create({
                title: t("workflows.cloneSuccess"),
                description: t("workflows.cloneSuccessDescription", {
                    name: clonedWorkflow.displayName,
                }),
                type: "success",
                duration: 3000,
            });
            refetch();
        },
        [refetch, t],
    );

    // 削除ハンドラー（将来実装）
    const handleDelete = React.useCallback((id: string) => {
        // TODO: バックエンドAPIの実装後に追加
        console.log("Delete workflow:", id);
        toaster.create({
            title: t("workflows.deleteNotImplemented"),
            description: t("workflows.deleteNotImplementedDescription"),
            type: "info",
            duration: 3000,
        });
    }, [t]);

    // Get sort icon for a field
    const getSortIcon = React.useCallback(
        (field: string) => {
            const order = orderBy.find((o) => o.field === field);
            if (!order) return null;
            return order.direction === OrderByDirection.ASC
                ? <LuArrowUp size={14} />
                : <LuArrowDown size={14} />;
        },
        [orderBy],
    );

    const handleSort = React.useCallback(
        (field: string) => {
            setOrderBy((prev) => {
                const existing = prev.findIndex((o) => o.field === field);
                if (existing >= 0) {
                    // Toggle direction
                    const newOrderBy = [...prev];
                    newOrderBy[existing] = create(OrderByClauseSchema, {
                        field: newOrderBy[existing].field,
                        direction: newOrderBy[existing].direction ===
                                OrderByDirection.ASC
                            ? OrderByDirection.DESC
                            : OrderByDirection.ASC,
                    });
                    return newOrderBy;
                }
                // Add new sort
                return [
                    ...prev,
                    create(OrderByClauseSchema, {
                        field,
                        direction: OrderByDirection.ASC,
                    }),
                ];
            });
        },
        [setOrderBy],
    );

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
                            onClick={() => navigate("/home")}
                        >
                            <LuArrowLeft />
                        </IconButton>
                        <Heading size="sm">{t("workflows.title")}</Heading>
                    </HStack>
                    <HStack gap={1}>
                        <IconButton
                            aria-label={t("workflows.refresh")}
                            variant="ghost"
                            size="xs"
                            onClick={refetch}
                            disabled={loading}
                        >
                            <LuRefreshCw />
                        </IconButton>
                        <Button
                            colorPalette="floorp"
                            size="xs"
                            onClick={() => setIsNewWorkflowModalOpen(true)}
                        >
                            <LuPlus />
                            <Text>{t("workflows.newWorkflow")}</Text>
                        </Button>
                    </HStack>
                </HStack>
            </Box>

            {/* Content */}
            <Box
                flex="1"
                overflowY="auto"
                px={{ base: 3, md: 4 }}
                py={{ base: 3, md: 4 }}
            >
                {/* Search */}
                <HStack gap={2} mb={3}>
                    <HStack
                        borderWidth="1px"
                        rounded="md"
                        px={2}
                        py={1}
                        gap={2}
                        flex={1}
                        maxW="400px"
                        bg="bg"
                        _focusWithin={{
                            borderColor: "floorp.500",
                            boxShadow:
                                "0 0 0 1px var(--chakra-colors-floorp-500)",
                        }}
                    >
                        <LuSearch
                            size={14}
                            color="var(--chakra-colors-fg-muted)"
                        />
                        <Input
                            placeholder={t("workflows.searchByName")}
                            value={filter.displayName || ""}
                            onChange={(e) => handleSearch(e.target.value)}
                            size="sm"
                            flex="1"
                            border="none"
                            outline="none"
                            bg="transparent"
                            _focus={{ outline: "none", boxShadow: "none" }}
                        />
                    </HStack>
                </HStack>

                {loading && workflows.length === 0
                    ? (
                        <Flex justify="center" align="center" h="200px">
                            <VStack gap={4}>
                                <Spinner size="lg" color="floorp.500" />
                                <Text color="fg.muted" fontSize="sm">
                                    {t("workflows.loading")}
                                </Text>
                            </VStack>
                        </Flex>
                    )
                    : error
                    ? (
                        <Card.Root>
                            <Card.Body>
                                <VStack gap={2}>
                                    <Text color="red.500" fontWeight="medium">
                                        {t("workflows.errorLoading")}
                                    </Text>
                                    <Text fontSize="sm" color="fg.muted">
                                        {error instanceof Error
                                            ? error.message
                                            : String(error)}
                                    </Text>
                                    <Button
                                        onClick={refetch}
                                        size="sm"
                                        variant="outline"
                                    >
                                        {t("workflows.retry")}
                                    </Button>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )
                    : workflows.length === 0
                    ? (
                        <Card.Root>
                            <Card.Body>
                                <VStack gap={4} py={8}>
                                    <LuFileText
                                        size={48}
                                        color="var(--chakra-colors-fg-muted)"
                                    />
                                    <VStack gap={2}>
                                        <Text fontWeight="medium" fontSize="lg">
                                            {t("workflows.noWorkflowsFound")}
                                        </Text>
                                        <Text color="fg.muted" fontSize="sm">
                                            {t("workflows.createFirstWorkflow")}
                                        </Text>
                                    </VStack>
                                    <Button
                                        colorPalette="floorp"
                                        onClick={() =>
                                            setIsNewWorkflowModalOpen(true)}
                                    >
                                        <LuPlus />
                                        <Text>
                                            {t("workflows.newWorkflow")}
                                        </Text>
                                    </Button>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )
                    : (
                        <SimpleGrid
                            columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                            gap={3}
                        >
                            {workflows.map((workflow) => (
                                <WorkflowCard
                                    key={workflow.id}
                                    workflow={workflow}
                                    onRun={(id) =>
                                        navigate(`/workflows/${id}`, {
                                            state: { autoRun: true },
                                        })}
                                    onClone={handleClone}
                                    onDelete={handleDelete}
                                    activeWorkflowId={activeWorkflowId}
                                />
                            ))}
                        </SimpleGrid>
                    )}

                {/* Pagination */}
                {workflows.length > 0 && (
                    <Flex justify="space-between" align="center" mt={4} gap={4}>
                        <Text fontSize="xs" color="fg.muted">
                            {workflows.length === 1
                                ? t("workflows.showing", {
                                    count: workflows.length,
                                })
                                : t("workflows.showingPlural", {
                                    count: workflows.length,
                                })}
                            {nextPageToken && t("workflows.moreAvailable")}
                        </Text>
                        <HStack gap={2}>
                            {pageToken && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        // Note: In a real implementation, you'd need to track previous page tokens
                                        // For now, this refetches the first page
                                        refetch();
                                    }}
                                >
                                    {t("workflows.previous")}
                                </Button>
                            )}
                            {nextPageToken && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={loadNextPage}
                                >
                                    {t("workflows.next")}
                                </Button>
                            )}
                        </HStack>
                    </Flex>
                )}
            </Box>

            {/* New Workflow Modal */}
            <Dialog.Root
                open={isNewWorkflowModalOpen}
                onOpenChange={(details) =>
                    setIsNewWorkflowModalOpen(details.open)}
            >
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        maxW={{ base: "100vw", md: "600px" }}
                        w={{ base: "100vw", md: "auto" }}
                    >
                        <Dialog.Header>
                            <Heading size="md">
                                {t("workflows.createNewWorkflow")}
                            </Heading>
                        </Dialog.Header>
                        <Dialog.CloseTrigger />
                        <Dialog.Body>
                            <VStack gap={4} align="stretch" py={2}>
                                <Text color="fg.muted">
                                    {t("workflows.chooseHowToCreate")}
                                </Text>

                                <Card.Root
                                    cursor="pointer"
                                    _hover={{ bg: "bg.subtle" }}
                                    onClick={() => {
                                        setIsNewWorkflowModalOpen(false);
                                        navigate("/generate");
                                    }}
                                >
                                    <Card.Body>
                                        <HStack gap={3} align="start">
                                            <Box
                                                p={3}
                                                rounded="md"
                                                bg="blue.500"
                                                color="white"
                                                flexShrink={0}
                                            >
                                                <LuSparkles size={24} />
                                            </Box>
                                            <VStack
                                                align="start"
                                                gap={1}
                                                flex="1"
                                            >
                                                <Text
                                                    fontWeight="semibold"
                                                    fontSize="md"
                                                >
                                                    {t("workflows.generate")}
                                                </Text>
                                                <Text
                                                    fontSize="sm"
                                                    color="fg.muted"
                                                >
                                                    {t("workflows.generateDescription")}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Card.Body>
                                </Card.Root>

                                <Card.Root
                                    opacity={0.6}
                                    cursor="not-allowed"
                                >
                                    <Card.Body>
                                        <HStack gap={3} align="start">
                                            <Box
                                                p={3}
                                                rounded="md"
                                                bg="gray.500"
                                                color="white"
                                                flexShrink={0}
                                            >
                                                <LuUpload size={24} />
                                            </Box>
                                            <VStack
                                                align="start"
                                                gap={1}
                                                flex="1"
                                            >
                                                <HStack gap={2} align="center">
                                                    <Text
                                                        fontWeight="semibold"
                                                        fontSize="md"
                                                    >
                                                        {t("workflows.import")}
                                                    </Text>
                                                    <Box
                                                        px={2}
                                                        py={0.5}
                                                        rounded="sm"
                                                        bg="orange.500"
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                        color="white"
                                                    >
                                                        {t("workflows.comingSoon")}
                                                    </Box>
                                                </HStack>
                                                <Text
                                                    fontSize="sm"
                                                    color="fg.muted"
                                                >
                                                    {t("workflows.importDescription")}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Card.Body>
                                </Card.Root>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button
                                variant="outline"
                                onClick={() => setIsNewWorkflowModalOpen(false)}
                            >
                                {t("workflows.cancel")}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>

            {/* Clone Workflow Dialog */}
            {workflowToClone && (
                <WorkflowCloneDialog
                    open={cloneDialogOpen}
                    onClose={() => {
                        setCloneDialogOpen(false);
                        setWorkflowToClone(null);
                    }}
                    workflow={workflowToClone}
                    onSuccess={handleCloneSuccess}
                />
            )}
        </Flex>
    );
}
