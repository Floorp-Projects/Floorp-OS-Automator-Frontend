import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import {
  LuClock,
  LuPackage,
  LuPlay,
  LuSearch,
  LuSend,
  LuSparkles,
  LuWrench,
  LuX,
} from "react-icons/lu";
import { useWorkflowsList } from "@/pages/workflows/useWorkflowsList";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import { CardSkeleton } from "@/components/ui/skeleton";
import { WorkflowResultType } from "@/gen/sapphillon/v1/workflow_pb";
import { useI18n } from "@/hooks/useI18n";

function formatDate(
  timestamp?: { seconds: bigint; nanos: number },
  locale: string = "ja-JP",
): string {
  if (!timestamp) return "";
  const date = new Date(Number(timestamp.seconds) * 1000);
  return date.toLocaleString(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(
  timestamp: { seconds: bigint; nanos: number } | undefined,
  t: (key: string, options?: { count?: number }) => string,
  locale: string = "ja",
): string {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(Number(timestamp.seconds) * 1000);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return t("common.time.justNow");
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t("common.time.minutesAgo", { count: minutes });
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t("common.time.hoursAgo", { count: hours });
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return t("common.time.daysAgo", { count: days });
  }
  return formatDate(timestamp, locale);
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const { t, currentLanguage } = useI18n();
  const navigate = useNavigate();
  const latestCode = workflow.workflowCode?.[workflow.workflowCode.length - 1];
  const latestResult = workflow.workflowResults
    ?.[workflow.workflowResults.length - 1];
  const hasResult = latestResult !== undefined;
  const isSuccess =
    latestResult?.resultType === WorkflowResultType.SUCCESS_UNSPECIFIED;

  const handleView = React.useCallback(() => {
    navigate(`/workflows/${workflow.id}`);
  }, [navigate, workflow.id]);

  const handleRun = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/workflows/${workflow.id}`, {
        state: { from: "/home", autoRun: true },
      });
    },
    [navigate, workflow.id],
  );

  return (
    <Card.Root
      cursor="pointer"
      _hover={{
        borderColor: "border.emphasized",
        shadow: "md",
      }}
      onClick={handleView}
    >
      <Card.Body p={4}>
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between" align="start">
            <VStack align="start" gap={1} flex="1">
              <Tooltip
                content={workflow.displayName || t("common.untitledWorkflow")}
                openDelay={500}
              >
                <Text
                  fontWeight="semibold"
                  fontSize="md"
                  css={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {workflow.displayName || t("common.untitledWorkflow")}
                </Text>
              </Tooltip>
              {workflow.description && (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  css={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {workflow.description}
                </Text>
              )}
            </VStack>
            <Button
              size="sm"
              colorPalette="floorp"
              onClick={handleRun}
              disabled={!latestCode}
            >
              <LuPlay />
            </Button>
          </HStack>

          {/* Metadata */}
          <HStack gap={2} flexWrap="wrap" fontSize="xs" color="fg.muted">
            {workflow.updatedAt && (
              <HStack gap={1}>
                <LuClock size={12} />
                <Text>
                  {t("common.updated")}:{" "}
                  {formatRelativeTime(workflow.updatedAt, t, currentLanguage)}
                </Text>
              </HStack>
            )}
            {hasResult && (
              <Badge
                colorPalette={isSuccess ? "green" : "red"}
                size="sm"
                fontSize="xs"
              >
                {isSuccess ? t("common.success") : t("common.failure")}
              </Badge>
            )}
            {!hasResult && latestCode && (
              <Badge colorPalette="gray" size="sm" fontSize="xs">
                {t("common.neverRun")}
              </Badge>
            )}
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prompt, setPrompt] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ワークフロー一覧を取得
  const { workflows, loading, error, refetch } = useWorkflowsList();

  // 検索フィルタリング
  const filteredWorkflows = React.useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const query = searchQuery.toLowerCase();
    return workflows.filter((w) => {
      const name = (w.displayName || "").toLowerCase();
      const desc = (w.description || "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [workflows, searchQuery]);

  const hasWorkflows = workflows.length > 0;
  const hasFilteredWorkflows = filteredWorkflows.length > 0;

  const handleSubmit = React.useCallback(() => {
    if (prompt.trim()) {
      navigate("/agent", { state: { prompt: prompt.trim(), autoStart: true } });
    }
  }, [prompt, navigate]);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
    }
  }, [prompt]);

  return (
    <Flex
      direction="column"
      h="full"
      minH={0}
      overflow="hidden"
      mx={{ base: -2, md: -4 }}
      mb={{ base: -2, md: -4 }}
      css={{
        height: "100%",
        "@media (max-height: 600px) and (orientation: landscape)": {
          minHeight: "auto",
        },
      }}
    >
      {/* Scrollable content area */}
      {!hasWorkflows
        ? (
          <Box
            flex="1"
            minH={0}
            overflowY="auto"
            overflowX="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={{ base: 3, sm: 4, md: 6 }}
            py={{ base: 4, sm: 6, md: 8 }}
          >
            <VStack
              w="full"
              maxW="3xl"
              margin="auto"
              gap={{ base: 6, sm: 7, md: 8 }}
              pb={{ base: 4, md: 6 }}
            >
              <VStack
                gap={{ base: 2, sm: 2.5, md: 3 }}
                textAlign="center"
                align="center"
                my="auto"
                pt={{ base: 4, md: 8 }}
              >
                <Box
                  fontSize={{ base: "4xl", sm: "5xl", md: "6xl" }}
                  mb={2}
                  color="fg.muted"
                >
                  <LuSparkles />
                </Box>
                <Heading
                  size={{ base: "xl", sm: "2xl", md: "3xl" }}
                  lineHeight="1.2"
                >
                  {t("home.title")}
                </Heading>
                <Text
                  color="fg.muted"
                  fontSize={{ base: "sm", sm: "md", md: "lg" }}
                  px={{ base: 2, md: 0 }}
                >
                  {t("home.subtitle")}
                </Text>
              </VStack>

              {/* Quick actions */}
              <HStack
                gap={{ base: 2, md: 3 }}
                justify="center"
                flexWrap="wrap"
                w="full"
              >
                <Button
                  onClick={() => {
                    if (prompt.trim()) {
                      navigate("/agent", {
                        state: { prompt: prompt.trim(), autoStart: true },
                      });
                    } else {
                      navigate("/agent");
                    }
                  }}
                  colorPalette="floorp"
                  size={{ base: "sm", md: "md" }}
                  disabled={!prompt.trim()}
                >
                  <LuPlay />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    {t("common.execute")}
                  </Text>
                </Button>
                <Button
                  onClick={() => navigate("/generate")}
                  variant="surface"
                  size={{ base: "sm", md: "md" }}
                >
                  <LuSparkles />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    {t("common.generate")}
                  </Text>
                </Button>
                <Button
                  onClick={() => navigate("/workflows")}
                  variant="surface"
                  size={{ base: "sm", md: "md" }}
                >
                  <LuWrench />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    {t("common.workflows")}
                  </Text>
                </Button>
                <Button
                  onClick={() => navigate("/plugins")}
                  variant="surface"
                  size={{ base: "sm", md: "md" }}
                >
                  <LuPackage />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    {t("common.plugins")}
                  </Text>
                </Button>
              </HStack>
            </VStack>
          </Box>
        )
        : (
          <Box
            flex="1"
            minH={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            px={{ base: 3, sm: 4, md: 6, lg: 8, xl: 12 }}
            py={{ base: 3, sm: 4, md: 6, lg: 8 }}
          >
            <Box
              w="full"
              maxW={{ base: "full", lg: "full" }}
              mx="auto"
              h="full"
              minH={0}
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <HStack
                justify="space-between"
                align="center"
                mb={4}
                flexShrink={0}
                flexWrap="wrap"
                gap={4}
              >
                <Heading size={{ base: "md", lg: "lg" }} textAlign="left">
                  {t("common.recentWorkflows")}
                </Heading>
                {workflows.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate("/workflows")}
                  >
                    {t("common.viewAll")}
                  </Button>
                )}
              </HStack>

              {/* Search bar */}
              {hasWorkflows && (
                <Box
                  mb={4}
                  flexShrink={0}
                  maxW={{ base: "full", lg: "md", xl: "lg" }}
                >
                  <HStack
                    gap={2}
                    borderWidth="1px"
                    rounded="md"
                    px={3}
                    py={2}
                    bg="bg"
                    _focusWithin={{ borderColor: "border.emphasized" }}
                  >
                    <LuSearch size={18} color="var(--chakra-colors-fg-muted)" />
                    <Input
                      placeholder={t("home.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderWidth="0"
                      px={0}
                      flex="1"
                    />
                    {searchQuery && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        onClick={() => setSearchQuery("")}
                        aria-label={t("common.clearSearch")}
                      >
                        <LuX />
                      </IconButton>
                    )}
                  </HStack>
                </Box>
              )}

              <Box
                flex="1"
                minH={0}
                overflowY="auto"
                overflowX="hidden"
                w="full"
              >
                {loading
                  ? (
                    <SimpleGrid
                      columns={{
                        base: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                        xl: 5,
                        "2xl": 6,
                      }}
                      gap={{ base: 3, md: 4 }}
                      w="full"
                      pb={4}
                    >
                      {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
                    </SimpleGrid>
                  )
                  : error
                  ? (
                    <VStack
                      align="center"
                      justify="center"
                      gap={4}
                      py={12}
                      color="fg.muted"
                    >
                      <Text fontSize="lg" fontWeight="medium">
                        {t("home.errorLoading")}
                      </Text>
                      <Button
                        colorPalette="floorp"
                        onClick={() => refetch()}
                      >
                        {t("home.retry")}
                      </Button>
                    </VStack>
                  )
                  : !hasFilteredWorkflows && searchQuery
                  ? (
                    <VStack
                      align="center"
                      justify="center"
                      gap={2}
                      py={12}
                      color="fg.muted"
                    >
                      <LuSearch size={48} />
                      <Text fontSize="lg" fontWeight="medium">
                        {t("common.noResults")}
                      </Text>
                      <Text fontSize="sm">
                        {t("home.searchNoResults", { query: searchQuery })}
                      </Text>
                    </VStack>
                  )
                  : (
                    <SimpleGrid
                      columns={{
                        base: 1,
                        sm: 2,
                        md: 3,
                        lg: 4,
                        xl: 5,
                        "2xl": 6,
                      }}
                      gap={{ base: 3, md: 4 }}
                      w="full"
                      pb={4}
                    >
                      {filteredWorkflows.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} />
                      ))}
                    </SimpleGrid>
                  )}
              </Box>
            </Box>
          </Box>
        )}

      {/* Fixed bottom input bar - ChatGPT mobile style */}
      <Box
        w="full"
        flexShrink={0}
        borderTopWidth="1px"
        borderTopColor="border"
        px={{ base: 3, sm: 4, md: 6, lg: 8, xl: 12 }}
        py={{ base: 3, md: 4, lg: 6 }}
        css={{
          "@media (max-height: 600px) and (orientation: landscape)": {
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
          },
        }}
      >
        <Box
          maxW={{ base: "full", lg: "full", xl: "7xl", "2xl": "8xl" }}
          mx="auto"
          borderWidth="1px"
          rounded="xl"
          p={{ base: 2, md: 3, lg: 4 }}
          bg="bg"
          shadow="sm"
        >
          {/* Prompt label */}
          <HStack mb={2} color="fg.muted" gap={1.5}>
            <LuSparkles size={14} />
            <Text fontSize="sm" fontWeight="medium">
              {t("home.promptLabel")}
            </Text>
          </HStack>
          <HStack gap={2} align="flex-end">
            <Textarea
              ref={textareaRef}
              placeholder={t("home.placeholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                // Cmd/Ctrl+Enter で送信（デスクトップ）
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                } // Enter キーで送信（モバイル、またはデスクトップで Shift なしの場合）
                // Shift+Enter は改行を許可
                else if (e.key === "Enter" && !e.shiftKey) {
                  // モバイルデバイスでは Enter で送信
                  // デスクトップでは Cmd+Enter を使うことを推奨
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }
              }}
              rows={2}
              minH="120px"
              fontSize="md"
              resize="none"
              css={{
                "&": {
                  maxHeight: "240px",
                  overflowY: "auto",
                  lineHeight: "1.6",
                },
              }}
              flex="1"
            />
            <IconButton
              aria-label={t("common.send")}
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              colorPalette="floorp"
              size={{ base: "md", md: "lg" }}
              flexShrink={0}
              minH={{ base: "36px", md: "44px" }}
              minW={{ base: "36px", md: "44px" }}
            >
              <LuSend />
            </IconButton>
          </HStack>
          <HStack
            justify="space-between"
            mt={2}
            color="fg.muted"
            display={{ base: "none", sm: "flex" }}
          >
            <Text fontSize={{ base: "xs", md: "sm" }}>
              {t("home.sendHint")}
            </Text>
          </HStack>
        </Box>
      </Box>
    </Flex>
  );
}
