import React from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Separator,
  Tabs,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { PromptPanel } from "./PromptPanel";
import { PluginsPanel } from "./PluginsPanel";
import { RunPanel } from "./RunPanel";
import { usePaneLayout } from "./usePaneLayout";
import { useWorkflowGeneration } from "./useWorkflowGeneration";
import type { GenerationEvent } from "./useWorkflowGeneration";
import { WorkflowCanvas, WorkflowFunctionList } from "@/components/workflow";
import { LuExpand, LuPlay } from "react-icons/lu";
import { StreamConsole } from "@/components/console";
import type {
  GenerateWorkflowResponse,
  RunWorkflowResponse,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import { useI18n } from "@/hooks/useI18n";
type WorkflowDefinition = GenerateWorkflowResponse["workflowDefinition"];

type LayoutCommonProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  streaming: boolean;
  latestDefinition: WorkflowDefinition | undefined;
  events: GenerationEvent[];
  runRes: RunWorkflowResponse | null;
  runLatest: () => void;
  onOpenWorkflowDialog: () => void;
};

type MobileLayoutProps = LayoutCommonProps;

function MobileLayout({
  prompt,
  onPromptChange,
  onStart,
  onStop,
  streaming,
  latestDefinition,
  events,
  runRes,
  runLatest,
  onOpenWorkflowDialog,
}: MobileLayoutProps) {
  const { t } = useI18n();
  return (
    <VStack
      align="stretch"
      gap={2}
      h="full"
      minH={0}
      css={{
        "@media (max-height: 600px) and (orientation: landscape)": {
          gap: "0.5rem",
        },
      }}
    >
      <Box
        p={{ base: 2, md: 3 }}
        borderWidth="1px"
        bg="bg"
        rounded="md"
        css={{
          "@media (max-height: 600px) and (orientation: landscape)": {
            padding: "0.5rem",
          },
        }}
      >
        <PromptPanel
          prompt={prompt}
          onChange={onPromptChange}
          onStart={onStart}
          onStop={onStop}
          streaming={streaming}
        />
      </Box>

      <Tabs.Root
        defaultValue="workflowRun"
        flex={1}
        minH={0}
        display="flex"
        flexDirection="column"
      >
        <Tabs.List bg="bg" borderWidth="1px" borderRadius="md" p={1}>
          <Tabs.Trigger value="workflowRun" flex={1}>
            <Text fontSize={{ base: "xs", sm: "sm" }}>
              {t("generate.workflowAndRun")}
            </Text>
          </Tabs.Trigger>
          <Tabs.Trigger value="plugins" flex={1}>
            <Text fontSize={{ base: "xs", sm: "sm" }}>
              {t("common.plugins")}
            </Text>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Combined Workflow + Run Tab */}
        <Tabs.Content
          value="workflowRun"
          p={0}
          mt={2}
          flex={1}
          minH={0}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <VStack align="stretch" gap={2} h="full" minH={0} flex={1}>
            {/* Workflow Section - Top half */}
            <Box
              flex={1}
              minH={0}
              borderWidth="1px"
              rounded="md"
              bg="bg"
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <HStack
                justify="space-between"
                px={2}
                py={1.5}
                borderBottomWidth="1px"
              >
                <Text fontWeight="medium" fontSize="xs">
                  {t("generate.workflowSteps")}
                </Text>
                <IconButton
                  aria-label={t("generate.expandWorkflow")}
                  size="xs"
                  variant="ghost"
                  onClick={onOpenWorkflowDialog}
                  disabled={!latestDefinition}
                >
                  <LuExpand size={14} />
                </IconButton>
              </HStack>
              <Box
                flex={1}
                minH={0}
                overflow="auto"
                px={2}
                py={1}
                bg="bg.subtle"
              >
                {latestDefinition
                  ? (
                    <WorkflowFunctionList
                      workflow={latestDefinition}
                    />
                  )
                  : (
                    <VStack gap={1} py={2} color="fg.muted">
                      <Text fontSize="xs">
                        {t("generate.noFunctionsGuide")}
                      </Text>
                    </VStack>
                  )}
              </Box>
            </Box>

            {/* Run Section - Bottom half */}
            <Box
              flex={1}
              minH={0}
              borderWidth="1px"
              rounded="md"
              bg="bg"
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <HStack
                justify="space-between"
                px={2}
                py={1.5}
                borderBottomWidth="1px"
                flexWrap="wrap"
                gap={1}
              >
                <Text fontWeight="medium" fontSize="xs">
                  {t("run.runStatus")}
                </Text>
                <HStack gap={1}>
                  <Badge
                    colorPalette={streaming
                      ? "blue"
                      : runRes
                      ? "green"
                      : "gray"}
                    fontSize="2xs"
                    px={1.5}
                    py={0.5}
                  >
                    {streaming
                      ? t("run.running")
                      : runRes
                      ? t("run.completed")
                      : t("run.waiting")}
                  </Badge>
                  <Button
                    size="xs"
                    onClick={runLatest}
                    disabled={!latestDefinition}
                    colorPalette="floorp"
                  >
                    <LuPlay size={12} />
                  </Button>
                </HStack>
              </HStack>
              <Box flex={1} minH={0} overflow="auto" p={1}>
                {events.length === 0 && !streaming && !runRes
                  ? (
                    <VStack gap={1} py={2} color="fg.muted" textAlign="center">
                      <LuPlay size={20} />
                      <Text fontSize="xs">{t("run.notExecuted")}</Text>
                    </VStack>
                  )
                  : <StreamConsole events={events} streaming={streaming} />}
              </Box>
            </Box>
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="plugins" p={0} mt={2} flex={1} minH={0}>
          <PluginsPanel />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}

type PaneLayoutApi = ReturnType<typeof usePaneLayout>;

type DesktopLayoutProps = LayoutCommonProps & {
  gridCols: PaneLayoutApi["gridCols"];
  gridRows: PaneLayoutApi["gridRows"];
  beginDrag: PaneLayoutApi["beginDrag"];
  onGutterKeyDown: PaneLayoutApi["onGutterKeyDown"];
  minRight: number;
  minBottom: number;
};

function DesktopLayout({
  prompt,
  onPromptChange,
  onStart,
  onStop,
  streaming,
  latestDefinition,
  events,
  runRes,
  runLatest,
  onOpenWorkflowDialog,
  gridCols,
  gridRows,
  beginDrag,
  onGutterKeyDown,
  minRight,
  minBottom,
}: DesktopLayoutProps) {
  const { t } = useI18n();
  return (
    <Box
      display="grid"
      gridTemplateColumns={gridCols}
      gridTemplateRows={gridRows}
      h="full"
      minH={0}
      overflow="hidden"
      gap={0}
    >
      {/* Center: Prompt + Latest Definition */}
      <VStack
        align="stretch"
        gap={2}
        p={{ base: 2, md: 3 }}
        borderWidth="1px"
        bg="bg"
        rounded="md"
        gridColumn={1}
        gridRow={1}
        minW={0}
        minH={0}
        display="grid"
        gridTemplateRows="minmax(0, 1fr)"
        overflow="hidden"
      >
        <Box minH={0} h="full" overflowY="auto">
          <VStack align="stretch" h="full" gap={2}>
            <PromptPanel
              prompt={prompt}
              onChange={onPromptChange}
              onStart={onStart}
              onStop={onStop}
              streaming={streaming}
            />
            <Separator />
            <VStack
              align="stretch"
              gap={2}
              minH={0}
              h="full"
              display="grid"
              gridTemplateRows="auto minmax(0, 1fr)"
              overflow="hidden"
            >
              <HStack justify="space-between" mb={1}>
                <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
                  {t("generate.workflowSteps")}
                </Text>
                <IconButton
                  aria-label={t("generate.expandWorkflow")}
                  size="sm"
                  variant="ghost"
                  onClick={onOpenWorkflowDialog}
                  disabled={!latestDefinition}
                  minH={{ base: "36px", md: "auto" }}
                >
                  <LuExpand />
                </IconButton>
              </HStack>
              {/* 使用される関数リスト */}
              <Box
                minH={0}
                h="full"
                borderWidth="1px"
                rounded="md"
                bg="bg.subtle"
                px={3}
                py={2}
                overflow="auto"
              >
                {latestDefinition
                  ? (
                    <WorkflowFunctionList
                      workflow={latestDefinition}
                    />
                  )
                  : (
                    <VStack gap={1} py={2} color="fg.muted">
                      <Text fontSize="xs">
                        {t("generate.noFunctionsGuide")}
                      </Text>
                    </VStack>
                  )}
              </Box>
            </VStack>
          </VStack>
        </Box>
      </VStack>

      {/* Vertical gutter */}
      <Box
        gridColumn={2}
        gridRow={1}
        onMouseDown={beginDrag("right")}
        onKeyDown={onGutterKeyDown("right")}
        role="separator"
        aria-orientation="vertical"
        aria-label={t("layout.resizeRightPane")}
        tabIndex={0}
        cursor="col-resize"
        _hover={{ bg: "border" }}
      />

      {/* Right: Plugins */}
      <Box gridColumn={3} gridRow={1} minW={minRight} minH={0} h="full">
        <PluginsPanel />
      </Box>

      {/* Horizontal gutter */}
      <Box
        gridColumn="1 / span 3"
        gridRow={2}
        onMouseDown={beginDrag("bottom")}
        onKeyDown={onGutterKeyDown("bottom")}
        role="separator"
        aria-orientation="horizontal"
        aria-label={t("layout.resizeRunPanel")}
        tabIndex={0}
        cursor="row-resize"
        _hover={{ bg: "border" }}
      />

      {/* Bottom: Run panel */}
      <Box gridColumn="1 / span 3" gridRow={3} minH={minBottom} h="full">
        <RunPanel
          streaming={streaming}
          events={events}
          latestDefinition={latestDefinition}
          runRes={runRes}
          onRun={runLatest}
        />
      </Box>
    </Box>
  );
}

export function GeneratePage() {
  const { t } = useI18n();
  const location = useLocation();
  const initialPrompt = (location.state as { prompt?: string })?.prompt || "";
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const {
    gridCols,
    gridRows,
    beginDrag,
    onGutterKeyDown,
    MIN_RIGHT: layoutMinRight,
    MIN_BOTTOM: layoutMinBottom,
  } = usePaneLayout();
  const { streaming, events, latest, runRes, start, stop, runLatest } =
    useWorkflowGeneration();
  const { open, onOpen, onClose } = useDisclosure();

  const onStart = React.useCallback(() => start(prompt), [start, prompt]);
  const latestDefinition = latest?.workflowDefinition;

  // 初期プロンプトがある場合は自動的に生成を開始
  const processedPromptRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const trimmedPrompt = initialPrompt?.trim();

    // プロンプトがあり、まだ処理していない場合のみ実行
    if (
      trimmedPrompt && processedPromptRef.current !== trimmedPrompt &&
      !streaming
    ) {
      processedPromptRef.current = trimmedPrompt;
      // start関数内のstreamingチェックで重複実行を防ぐ
      start(trimmedPrompt);
    }
  }, [initialPrompt, streaming, start]);

  return (
    <>
      {/* モバイル・タブレット表示 (lg未満) */}
      <Box
        display={{ base: "block", lg: "none" }}
        h="full"
        minH={0}
        overflow="hidden"
      >
        <MobileLayout
          prompt={prompt}
          onPromptChange={(value) => setPrompt(value)}
          onStart={onStart}
          onStop={stop}
          streaming={streaming}
          latestDefinition={latestDefinition}
          events={events}
          runRes={runRes}
          runLatest={runLatest}
          onOpenWorkflowDialog={onOpen}
        />
      </Box>

      {/* デスクトップ表示 (lg以上) */}
      <Box
        display={{ base: "none", lg: "block" }}
        h="full"
        minH={0}
        overflow="hidden"
      >
        <DesktopLayout
          prompt={prompt}
          onPromptChange={(value) => setPrompt(value)}
          onStart={onStart}
          onStop={stop}
          streaming={streaming}
          latestDefinition={latestDefinition}
          events={events}
          runRes={runRes}
          runLatest={runLatest}
          onOpenWorkflowDialog={onOpen}
          gridCols={gridCols}
          gridRows={gridRows}
          beginDrag={beginDrag}
          onGutterKeyDown={onGutterKeyDown}
          minRight={layoutMinRight}
          minBottom={layoutMinBottom}
        />
      </Box>

      <Dialog.Root
        open={open}
        onOpenChange={(e) => !e.open && onClose()}
        size={{ base: "full", md: "xl" }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={{ base: "100vw", md: "90vw" }}
            maxH={{ base: "100vh", md: "90vh" }}
          >
            <Dialog.Header>
              <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>
                {t("generate.workflow")}
              </Text>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body
              minH={{ base: "60vh", md: "70vh" }}
              p={0}
              padding={{ base: 2, md: 4 }}
              display="flex"
              flexDir="column"
            >
              {latestDefinition && (
                <WorkflowCanvas workflow={latestDefinition} />
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} size={{ base: "sm", md: "md" }}>
                {t("generate.close")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}

export default GeneratePage;
