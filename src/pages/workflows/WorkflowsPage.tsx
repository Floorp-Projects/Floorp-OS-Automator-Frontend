import React from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    IconButton,
    Text,
} from "@chakra-ui/react";
import {
    LuArrowLeft,
    LuPlus,
    LuRefreshCw,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useWorkflowsList } from "./useWorkflowsList";
import { WorkflowCloneDialog } from "./WorkflowCloneDialog";
import { useWorkflowRunState } from "@/contexts/WorkflowRunContext";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import { toaster } from "@/components/ui/toaster-instance";
import { useI18n } from "@/hooks/useI18n";
import { WorkflowGrid } from "./WorkflowGrid";
import { WorkflowSearchBar } from "./WorkflowSearchBar";
import { WorkflowPagination } from "./WorkflowPagination";
import { NewWorkflowDialog } from "./NewWorkflowDialog";

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
                <WorkflowSearchBar
                    value={filter.displayName || ""}
                    onChange={handleSearch}
                    placeholder={t("workflows.searchByName")}
                />

                <WorkflowGrid
                    workflows={workflows}
                    loading={loading}
                    error={error}
                    onRun={(id) =>
                        navigate(`/workflows/${id}`, {
                            state: { autoRun: true },
                        })
                    }
                    onClone={handleClone}
                    onDelete={handleDelete}
                    activeWorkflowId={activeWorkflowId}
                    onRetry={refetch}
                    onNewWorkflow={() => setIsNewWorkflowModalOpen(true)}
                    t={t}
                />

                <WorkflowPagination
                    count={workflows.length}
                    hasMore={!!nextPageToken}
                    hasPrevious={!!pageToken}
                    onNext={loadNextPage}
                    onPrevious={refetch}
                    messages={{
                        showing: t("workflows.showing", { count: 1 }),
                        showingPlural: t("workflows.showingPlural", { count: 2 }),
                        moreAvailable: t("workflows.moreAvailable"),
                        previous: t("workflows.previous"),
                        next: t("workflows.next"),
                    }}
                />
            </Box>

            <NewWorkflowDialog
                open={isNewWorkflowModalOpen}
                onOpenChange={(open) => setIsNewWorkflowModalOpen(open)}
                onSelectGenerate={() => {
                    setIsNewWorkflowModalOpen(false);
                    navigate("/generate");
                }}
                t={t}
            />

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
