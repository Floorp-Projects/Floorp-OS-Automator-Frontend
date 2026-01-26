import {
  Button,
  Card,
  Flex,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuFileText, LuPlus } from "react-icons/lu";
import { WorkflowCard } from "./WorkflowCard";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";

interface WorkflowGridProps {
  workflows: Workflow[];
  loading: boolean;
  error: unknown;
  onRun: (id: string) => void;
  onClone: (workflow: Workflow) => void;
  onDelete?: (id: string) => void;
  activeWorkflowId: string | null;
  onRetry: () => void;
  onNewWorkflow: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function WorkflowGrid({
  workflows,
  loading,
  error,
  onRun,
  onClone,
  onDelete,
  activeWorkflowId,
  onRetry,
  onNewWorkflow,
  t,
}: WorkflowGridProps) {
  // Loading state
  if (loading && workflows.length === 0) {
    return (
      <Flex justify="center" align="center" h="200px">
        <VStack gap={4}>
          <Spinner size="lg" color="floorp.500" />
          <Text color="fg.muted" fontSize="sm">
            {t("workflows.loading")}
          </Text>
        </VStack>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack gap={2}>
            <Text color="red.500" fontWeight="medium">
              {t("workflows.errorLoading")}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {error instanceof Error ? error.message : String(error)}
            </Text>
            <Button onClick={onRetry} size="sm" variant="outline">
              {t("workflows.retry")}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  // Empty state
  if (workflows.length === 0) {
    return (
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
            <Button colorPalette="floorp" onClick={onNewWorkflow}>
              <LuPlus />
              <Text>{t("workflows.newWorkflow")}</Text>
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  // Grid of workflows
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={3}>
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onRun={(id) => onRun(id)}
          onClone={onClone}
          onDelete={onDelete}
          activeWorkflowId={activeWorkflowId}
        />
      ))}
    </SimpleGrid>
  );
}
