import {
  Badge,
  Box,
  Button,
  HStack,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { RunWorkflowResponse } from "@/gen/sapphillon/v1/workflow_service_pb";
import { StreamConsole } from "@/components/console";
import { EmptyState } from "@/components/ui/empty-state";
import { LuPlay } from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";

export type GenerationEvent = {
  t: number;
  kind: "message" | "error" | "done";
  payload?: unknown;
};

export function RunPanel(
  {
    streaming,
    events,
    latestDefinition,
    runRes,
    onRun,
  }: {
    streaming: boolean;
    events: GenerationEvent[];
    latestDefinition?: unknown;
    runRes: RunWorkflowResponse | null;
    onRun: () => void;
  },
) {
  const { t } = useI18n();
  return (
    <VStack
      align="stretch"
      gap={1}
      p={{ base: 1.5, md: 2 }}
      bg="bg"
      rounded="md"
      h="full"
      minH={0}
      display="grid"
      gridTemplateRows="auto minmax(0, 1fr)"
      overflow="hidden"
    >
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>{t("run.title")}</Text>
        <HStack gap={2}>
          <Badge
            colorPalette={streaming ? "blue" : runRes ? "green" : "gray"}
            fontSize="xs"
            px={{ base: 1.5, md: 2.5 }}
            py={{ base: 0.5, md: 1 }}
            fontWeight="medium"
          >
            {streaming ? t("run.running") : runRes ? t("run.completed") : t("run.waiting")}
          </Badge>
          <Button
            size="sm"
            onClick={onRun}
            disabled={!latestDefinition}
            minH={{ base: "36px", md: "auto" }}
            colorPalette="floorp"
          >
            <LuPlay size={14} />
            <Text fontSize={{ base: "xs", sm: "sm" }}>{t("run.title")}</Text>
          </Button>
        </HStack>
      </HStack>
      <Separator my={{ base: 1, md: 2 }} />
      <Box minH={0} h="full" overflow="hidden">
        {events.length === 0 && !streaming && !runRes ? (
          <EmptyState
            icon={<LuPlay />}
            title={t("run.notExecuted")}
            description={t("run.notExecutedDescription")}
          />
        ) : (
        <StreamConsole events={events} streaming={streaming} />
        )}
      </Box>
    </VStack>
  );
}
