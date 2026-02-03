import React from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  LuPackage,
  LuPlay,
  LuSend,
  LuSparkles,
  LuWrench,
} from "react-icons/lu";
import { useWorkflowsList } from "@/pages/workflows/useWorkflowsList";
import { useI18n } from "@/hooks/useI18n";

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prompt, setPrompt] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ワークフロー一覧を取得
  const { workflows, loading } = useWorkflowsList();

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

  // 表示するワークフロー数を制限（最大6件）
  const displayWorkflows = React.useMemo(() => {
    return filteredWorkflows.slice(0, 6);
  }, [filteredWorkflows]);

  const hasWorkflows = workflows.length > 0;
  const hasMoreWorkflows = filteredWorkflows.length > 6;

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
      {/* Central content area - always centered */}
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
          gap={{ base: 5, sm: 6, md: 7 }}
          pb={{ base: 4, md: 6 }}
        >
          {/* Welcome message */}
          <VStack
            gap={2}
            textAlign="center"
            align="center"
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

          {/* Quick actions */}
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

          {/* Recent workflows chips */}
          {hasWorkflows && !loading && (
            <VStack gap={3} w="full" align="center">
              <HStack justify="space-between" w="full" maxW="xl" px={1}>
                <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                  {t("common.recentWorkflows")}
                </Text>
                {hasMoreWorkflows && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    fontSize="xs"
                    h="auto"
                    py={0}
                    onClick={() => navigate("/workflows")}
                  >
                    {t("common.viewAll")}
                  </Button>
                )}
              </HStack>
              <HStack
                gap={2}
                flexWrap="wrap"
                justify="center"
                w="full"
                maxW="xl"
              >
                {displayWorkflows.map((workflow) => (
                  <Button
                    key={workflow.id}
                    size="xs"
                    variant="outline"
                    borderRadius="full"
                    fontWeight="normal"
                    color="fg.muted"
                    borderColor="border"
                    _hover={{
                      borderColor: "floorp.500",
                      color: "fg",
                    }}
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    maxW="200px"
                  >
                    <Text lineClamp={1} fontSize="xs">
                      {workflow.displayName || t("common.untitledWorkflow")}
                    </Text>
                  </Button>
                ))}
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>

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
              <Text
                fontSize="xs"
                color="fg.muted"
                display={{ base: "none", md: "block" }}
              >
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
