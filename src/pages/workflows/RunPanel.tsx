import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlay } from "react-icons/lu";
import { TerminalConsole } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionList } from "@/components/workflow/PermissionList";
import { useI18n } from "@/hooks/useI18n";
import type { RunEvent } from "@/types/workflow";

interface RunPanelProps {
  running: boolean;
  events: RunEvent[];
  workflow: any | null;
  runRes: any;
  onRun: () => void;
  latestCode: any;
}

export function RunPanel({
  running,
  events,
  workflow,
  runRes,
  onRun,
  latestCode,
}: RunPanelProps) {
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
          <Text fontWeight="medium" fontSize="sm">
            {t("run.title")}
          </Text>
          <HStack gap={2}>
            <Text
              fontSize="xs"
              color={
                running
                  ? "floorp.500"
                  : runRes
                    ? "green.500"
                    : "fg.muted"
              }
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
              <Text fontSize="xs">{t("run.title")}</Text>
            </Button>
          </HStack>
        </HStack>
        <Separator my={1} />
        <Box minH={0} h="full" overflow="hidden">
          {events.length === 0 && !running && !runRes ? (
            <EmptyState
              icon={<LuPlay />}
              title={t("run.notExecuted")}
              description={t("run.notExecutedDescription")}
            />
          ) : (
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
        {latestCode?.allowedPermissions ? (
          <PermissionList permissions={latestCode.allowedPermissions} />
        ) : (
          <Text fontSize="xs" color="fg.muted">
            {t("workflowView.noPermissionInfo")}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
