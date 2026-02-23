import React from "react";
import {
  Badge,
  Card,
  HStack,
  IconButton,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuClock,
  LuCopy,
  LuEllipsisVertical,
  LuPlay,
  LuTrash2,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { formatRelativeTimestamp } from "@/lib/time-utils";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";

interface WorkflowCardProps {
  workflow: Workflow;
  onRun: (id: string) => void;
  onClone: (workflow: Workflow) => void;
  onDelete?: (id: string) => void;
  activeWorkflowId: string | null;
}

export const WorkflowCard = React.memo<WorkflowCardProps>(
  ({ workflow, onRun, onClone, onDelete, activeWorkflowId }) => {
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
        borderRadius="xl"
        _hover={{
          borderColor: "floorp.300",
          _dark: {
            borderColor: "floorp.700",
          },
        }}
        onClick={handleView}
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
                  {isRunning ? <Spinner size="xs" /> : <LuPlay size={14} />}
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
                    {formatRelativeTimestamp(workflow.updatedAt, t)}
                  </Text>
                </HStack>
              )}
              {hasResult && (
                <Badge
                  colorPalette={isSuccess ? "green" : "red"}
                  size="xs"
                  fontSize="2xs"
                >
                  {isSuccess ? t("common.success") : t("common.failure")}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.workflow.id === nextProps.workflow.id &&
      prevProps.workflow.updatedAt?.seconds ===
        nextProps.workflow.updatedAt?.seconds &&
      prevProps.workflow.displayName === nextProps.workflow.displayName &&
      prevProps.activeWorkflowId === nextProps.activeWorkflowId
    );
  },
);

WorkflowCard.displayName = "WorkflowCard";
