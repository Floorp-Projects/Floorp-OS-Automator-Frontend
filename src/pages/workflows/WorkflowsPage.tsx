import React from "react";
import {
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
    Spinner,
    Table,
    Text,
    VStack,
} from "@chakra-ui/react";
import {
    LuArrowDown,
    LuArrowUp,
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

function WorkflowRow({
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
    const latestResult = workflow.workflowResults
        ?.[workflow.workflowResults.length - 1];

    const isRunning = activeWorkflowId === workflow.id;

    return (
        <Table.Row
            key={workflow.id}
            _hover={{
                backgroundColor: "var(--chakra-colors-bg-subtle)",
            }}
        >
            <Table.Cell>
                <VStack align="start" gap={1}>
                    <Text
                        fontWeight="medium"
                        css={{
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {workflow.displayName || "-"}
                    </Text>
                    {workflow.description && (
                        <Text
                            fontSize="sm"
                            color="fg.muted"
                            css={{
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {workflow.description}
                        </Text>
                    )}
                </VStack>
            </Table.Cell>
            <Table.Cell display={{ base: "none", md: "table-cell" }}>
                {latestResult
                    ? (
                        <VStack align="start" gap={1}>
                            <HStack gap={2}>
                                <Box
                                    w={2}
                                    h={2}
                                    rounded="full"
                                    bg={latestResult.resultType === 0
                                        ? "green.500"
                                        : latestResult.resultType === 1
                                        ? "red.500"
                                        : "gray.500"}
                                />
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color={latestResult.resultType === 0
                                        ? "green.700"
                                        : latestResult.resultType === 1
                                        ? "red.700"
                                        : "fg.muted"}
                                    css={{
                                        _dark: {
                                            color: latestResult.resultType === 0
                                                ? "var(--chakra-colors-green-300)"
                                                : latestResult.resultType === 1
                                                ? "var(--chakra-colors-red-300)"
                                                : "var(--chakra-colors-fg-muted)",
                                        },
                                    }}
                                    whiteSpace="nowrap"
                                >
                                    {latestResult.resultType === 0
                                        ? t("common.success")
                                        : t("common.failure")}
                                </Text>
                            </HStack>
                            {latestResult.ranAt && (
                                <Text
                                    fontSize="xs"
                                    color="fg.muted"
                                    whiteSpace="nowrap"
                                >
                                    {formatDate(latestResult.ranAt)}
                                </Text>
                            )}
                        </VStack>
                    )
                    : (
                        <Text
                            fontSize="sm"
                            color="fg.muted"
                            whiteSpace="nowrap"
                        >
                            {t("workflows.noRuns")}
                        </Text>
                    )}
            </Table.Cell>
            <Table.Cell onClick={(e) => e.stopPropagation()}>
                <HStack gap={1.5}>
                    {/* Desktop: Show Run button */}
                    <Button
                        size="sm"
                        variant="outline"
                        colorPalette="floorp"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isRunning) onRun(workflow.id);
                        }}
                        disabled={isRunning}
                        _hover={{
                            bg: "floorp.50",
                            borderColor: "floorp.300",
                            _dark: {
                                bg: "floorp.950",
                                borderColor: "floorp.700",
                            },
                        }}
                        display={{ base: "none", md: "flex" }}
                    >
                        {t("workflows.run")}
                    </Button>
                    <MenuRoot>
                        <MenuTrigger asChild>
                            <IconButton
                                size="sm"
                                variant="ghost"
                                aria-label={t("workflows.moreActions")}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <LuEllipsisVertical />
                            </IconButton>
                        </MenuTrigger>
                        <Portal>
                            <MenuPositioner>
                                <MenuContent>
                                    {/* Mobile: Show Run in menu */}
                                    <MenuItem
                                        value="run"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isRunning) onRun(workflow.id);
                                        }}
                                        disabled={isRunning}
                                        display={{ base: "flex", md: "none" }}
                                    >
                                        <LuPlay />
                                        {t("workflows.run")}
                                    </MenuItem>
                                    <MenuItem
                                        value="clone"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClone(workflow);
                                        }}
                                    >
                                        <LuCopy />
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
                                            <LuTrash2 />
                                            {t("workflows.delete")}
                                        </MenuItem>
                                    )}
                                </MenuContent>
                            </MenuPositioner>
                        </Portal>
                    </MenuRoot>
                </HStack>
            </Table.Cell>
        </Table.Row>
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
        <Flex direction="column" h="full" overflow="hidden">
            {/* Header */}
            <Box
                borderBottomWidth="1px"
                borderBottomColor="border"
                px={{ base: 4, md: 6 }}
                py={4}
            >
                <Flex
                    justify="space-between"
                    align="center"
                    flexWrap="wrap"
                    gap={4}
                >
                    <Heading size="lg">{t("workflows.title")}</Heading>
                    <HStack gap={2}>
                        <Button
                            onClick={refetch}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <LuRefreshCw />
                            <Text>{t("workflows.refresh")}</Text>
                        </Button>
                        <Button
                            colorPalette="floorp"
                            size="sm"
                            onClick={() => setIsNewWorkflowModalOpen(true)}
                        >
                            <LuPlus />
                            <Text>{t("workflows.newWorkflow")}</Text>
                        </Button>
                    </HStack>
                </Flex>
            </Box>

            {/* Filters */}
            <Box
                borderBottomWidth="1px"
                borderBottomColor="border"
                px={{ base: 4, md: 6 }}
                py={3}
            >
                <HStack gap={3} flexWrap="wrap">
                    <HStack
                        borderWidth="1px"
                        rounded="md"
                        px={3}
                        py={1}
                        gap={2}
                        maxW="300px"
                        bg="bg"
                        _focusWithin={{
                            outline: "2px solid",
                            outlineColor: "accent.focusRing",
                        }}
                    >
                        <LuSearch
                            size={16}
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
                        />
                    </HStack>
                </HStack>
            </Box>

            {/* Content */}
            <Box flex="1" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
                {loading && workflows.length === 0
                    ? (
                        <Flex justify="center" align="center" h="200px">
                            <VStack gap={4}>
                                <Spinner size="lg" />
                                <Text color="fg.muted">
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
                        <Card.Root>
                            <Card.Body p={0}>
                                <Box overflowX="auto">
                                    <Table.Root>
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.ColumnHeader
                                                    cursor="pointer"
                                                    onClick={() =>
                                                        handleSort(
                                                            "display_name",
                                                        )}
                                                    minW="200px"
                                                    _hover={{ bg: "bg.subtle" }}
                                                >
                                                    <HStack gap={2}>
                                                        <Text>
                                                            {t("workflows.name")}
                                                        </Text>
                                                        {getSortIcon(
                                                            "display_name",
                                                        )}
                                                    </HStack>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader
                                                    minW="120px"
                                                    display={{
                                                        base: "none",
                                                        md: "table-cell",
                                                    }}
                                                >
                                                    {t("workflows.lastRun")}
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader minW="150px">
                                                    {t("workflows.actions")}
                                                </Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {workflows.map((workflow) => (
                                                <WorkflowRow
                                                    key={workflow.id}
                                                    workflow={workflow}
                                                    onRun={(id) =>
                                                        navigate(
                                                            `/workflows/${id}`,
                                                        )}
                                                    onClone={handleClone}
                                                    onDelete={handleDelete}
                                                    activeWorkflowId={activeWorkflowId}
                                                />
                                            ))}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>
                            </Card.Body>
                        </Card.Root>
                    )}

                {/* Pagination */}
                {workflows.length > 0 && (
                    <Flex justify="space-between" align="center" mt={4} gap={4}>
                        <Text fontSize="sm" color="fg.muted">
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
