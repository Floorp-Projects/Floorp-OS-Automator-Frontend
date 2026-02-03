import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
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
} from "react-icons/lu";
import { useWorkflowsList } from "@/pages/workflows/useWorkflowsList";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import { CardSkeleton } from "@/components/ui/skeleton";
import { WorkflowResultType } from "@/gen/sapphillon/v1/workflow_pb";
import { useI18n } from "@/hooks/useI18n";
import { formatRelativeTimestamp } from "@/lib/time-utils";

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
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border"
      bg="bg"
      transition="all 0.15s"
      _hover={{
        borderColor: "fg.muted",
        transform: "translateY(-1px)",
      }}
      onClick={handleView}
    >
      <Card.Body p={{ base: 3, md: 4 }}>
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between" align="start" gap={2}>
            <VStack align="start" gap={0.5} flex="1" minW={0}>
              <Tooltip
                content={workflow.displayName || t("common.untitledWorkflow")}
                openDelay={500}
              >
                <Text
                  fontWeight="medium"
                  fontSize="sm"
                  color="fg"
                  css={{
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {workflow.displayName || t("common.untitledWorkflow")}
                </Text>
              </Tooltip>
              {workflow.description && (
                <Text
                  fontSize="xs"
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
            <IconButton
              aria-label={t("common.run")}
              size="xs"
              borderRadius="lg"
              onClick={handleRun}
              disabled={!latestCode}
              colorPalette="floorp"
              _disabled={{ opacity: 0.5 }}
            >
              <LuPlay size={12} />
            </IconButton>
          </HStack>

          {/* Metadata */}
          <HStack gap={2} flexWrap="wrap" fontSize="xs" color="fg.muted">
            {workflow.updatedAt && (
              <HStack gap={1}>
                <LuClock size={12} />
                <Text>
                  {t("common.updated")}:{" "}
                  {formatRelativeTimestamp(workflow.updatedAt, t, currentLanguage)}
                </Text>
              </HStack>
            )}
            {hasResult && (
              <Badge
                colorPalette={isSuccess ? "green" : "red"}
                size="sm"
                fontSize="2xs"
                borderRadius="full"
              >
                {isSuccess ? t("common.success") : t("common.failure")}
              </Badge>
            )}
            {!hasResult && latestCode && (
              <Badge colorPalette="gray" size="sm" fontSize="2xs" borderRadius="full">
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ワークフロー一覧を取得
  const { workflows, loading, error, refetch } = useWorkflowsList();

  // 最新順にソート（updatedAtの降順）
  const sortedWorkflows = React.useMemo(() => {
    return [...workflows].sort((a, b) => {
      const aTime = a.updatedAt?.seconds ?? a.createdAt?.seconds ?? BigInt(0);
      const bTime = b.updatedAt?.seconds ?? b.createdAt?.seconds ?? BigInt(0);
      // 降順（新しいものが先）
      return Number(bTime - aTime);
    });
  }, [workflows]);

  // プロンプト入力に基づいてフィルタリング
  const filteredWorkflows = React.useMemo(() => {
    if (!prompt.trim()) return sortedWorkflows;
    const query = prompt.toLowerCase();
    return sortedWorkflows.filter((w) => {
      const name = (w.displayName || "").toLowerCase();
      const desc = (w.description || "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [sortedWorkflows, prompt]);

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
                gap={2}
                textAlign="center"
                align="center"
                my="auto"
              >
                <Text
                  fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                  fontWeight="normal"
                  color="fg"
                  letterSpacing="-0.02em"
                >
                  {t("home.title")}
                </Text>
                <Text
                  color="fg.muted"
                  fontSize={{ base: "sm", md: "md" }}
                >
                  {t("home.subtitle")}
                </Text>
              </VStack>

              {/* Quick actions - シンプルなボタン */}
              <HStack
                gap={2}
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
                  size="sm"
                  borderRadius="lg"
                  colorPalette="floorp"
                  disabled={!prompt.trim()}
                >
                  <LuPlay size={14} />
                  <Text fontSize="sm">{t("common.execute")}</Text>
                </Button>
                <Button
                  onClick={() => navigate("/generate")}
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  color="fg.muted"
                  _hover={{ bg: "bg.muted" }}
                >
                  <LuSparkles size={14} />
                  <Text fontSize="sm">{t("common.generate")}</Text>
                </Button>
                <Button
                  onClick={() => navigate("/workflows")}
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  color="fg.muted"
                  _hover={{ bg: "bg.muted" }}
                >
                  <LuWrench size={14} />
                  <Text fontSize="sm">{t("common.workflows")}</Text>
                </Button>
                <Button
                  onClick={() => navigate("/plugins")}
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  color="fg.muted"
                  _hover={{ bg: "bg.muted" }}
                >
                  <LuPackage size={14} />
                  <Text fontSize="sm">{t("common.plugins")}</Text>
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
            px={{ base: 4, md: 6, lg: 8 }}
            py={{ base: 4, md: 6 }}
          >
            <Box
              w="full"
              maxW="7xl"
              mx="auto"
              h="full"
              minH={0}
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <Flex
                justify="space-between"
                align="center"
                mb={{ base: 3, md: 4 }}
                flexShrink={0}
              >
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="medium"
                  color="fg.muted"
                >
                  {t("common.recentWorkflows")}
                </Text>
                {workflows.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    borderRadius="lg"
                    onClick={() => navigate("/workflows")}
                  >
                    {t("common.viewAll")}
                  </Button>
                )}
              </Flex>

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
                  : !hasFilteredWorkflows && prompt.trim()
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
                        {t("home.searchNoResults", { query: prompt })}
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

      {/* Fixed bottom input bar - Claude風 */}
      <Box
        w="full"
        flexShrink={0}
        px={{ base: 3, sm: 4, md: 6, lg: 8, xl: 12 }}
        py={{ base: 3, md: 4 }}
      >
        <Box
          maxW="3xl"
          mx="auto"
        >
          <Flex
            borderWidth="1px"
            borderColor="border"
            borderRadius="2xl"
            bg="bg"
            overflow="hidden"
            direction="column"
            _focusWithin={{
              borderColor: "fg.muted",
            }}
          >
            <Textarea
              ref={textareaRef}
              placeholder={t("home.placeholder")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={2}
              minH="60px"
              maxH="120px"
              fontSize={{ base: "sm", md: "md" }}
              resize="none"
              border="none"
              px={{ base: 4, md: 5 }}
              pt={{ base: 3, md: 4 }}
              pb={2}
              _focus={{
                boxShadow: "none",
                outline: "none",
              }}
              _placeholder={{
                color: "fg.muted",
              }}
            />
            <Flex
              justify={{ base: "flex-end", md: "space-between" }}
              align="center"
              px={{ base: 3, md: 4 }}
              py={2}
            >
              <Text fontSize="xs" color="fg.muted" display={{ base: "none", md: "block" }}>
                {t("home.sendHint")}
              </Text>
              <IconButton
                aria-label={t("common.send")}
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                size="sm"
                borderRadius="lg"
                colorPalette="floorp"
                _disabled={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                }}
              >
                <LuSend size={16} />
              </IconButton>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}
