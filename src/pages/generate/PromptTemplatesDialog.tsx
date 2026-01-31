import React from "react";
import {
  Badge,
  Box,
  Dialog,
  HStack,
  IconButton,
  Input,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuFileText, LuSearch, LuX } from "react-icons/lu";
import {
  getCategoryColor,
  getCategoryLabel,
  PROMPT_TEMPLATES,
  type PromptTemplate,
  searchTemplates,
} from "@/lib/prompt-templates";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/hooks/useI18n";

interface PromptTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (prompt: string) => void;
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: PromptTemplate;
  onSelect: () => void;
}) {
  return (
    <Box
      p={3}
      borderWidth="1px"
      rounded="md"
      bg="bg"
      cursor="pointer"
      _hover={{ bg: "bg.subtle", borderColor: "accent.emphasized" }}
      onClick={onSelect}
    >
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between" gap={2}>
          <Text fontWeight="medium" fontSize="sm" flex="1">
            {template.title}
          </Text>
          <Badge
            size="xs"
            colorPalette={getCategoryColor(template.category)}
          >
            {getCategoryLabel(template.category)}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {template.description}
        </Text>
        {template.tags.length > 0 && (
          <HStack gap={1} flexWrap="wrap">
            {template.tags.map((tag) => (
              <Badge
                key={tag}
                size="xs"
                variant="subtle"
                colorPalette="gray"
              >
                {tag}
              </Badge>
            ))}
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

export function PromptTemplatesDialog({
  open,
  onClose,
  onSelectTemplate,
}: PromptTemplatesDialogProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<
    PromptTemplate["category"] | "all"
  >("all");

  const filteredTemplates = React.useMemo(() => {
    let templates = PROMPT_TEMPLATES;

    // カテゴリフィルタ
    if (activeCategory !== "all") {
      templates = templates.filter((t) => t.category === activeCategory);
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery);
    }

    return templates;
  }, [searchQuery, activeCategory]);

  const handleSelect = React.useCallback(
    (prompt: string) => {
      onSelectTemplate(prompt);
      onClose();
    },
    [onSelectTemplate, onClose],
  );

  const categories: Array<{
    value: PromptTemplate["category"] | "all";
    label: string;
  }> = [
    { value: "all", label: t("templates.category.all") },
    { value: "automation", label: t("templates.category.automation") },
    { value: "data", label: t("templates.category.data") },
    { value: "communication", label: t("templates.category.communication") },
    { value: "development", label: t("templates.category.development") },
    { value: "other", label: t("templates.category.other") },
  ];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "xl" }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          maxW={{ base: "100vw", md: "800px" }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <Dialog.Header>
            <HStack justify="space-between" w="full">
              <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>
                {t("templates.title")}
              </Text>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label={t("templates.close")} variant="ghost" size="sm" color="fg">
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </HStack>
          </Dialog.Header>

          <Dialog.Body p={0} display="flex" flexDir="column" minH="500px">
            {/* 検索バー */}
            <Box px={4} pt={2} pb={3} borderBottomWidth="1px">
              <HStack
                borderWidth="1px"
                rounded="md"
                px={3}
                py={1}
                gap={2}
                bg="bg"
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "accent.focusRing",
                }}
              >
                <LuSearch size={16} color="var(--chakra-colors-fg-muted)" />
                <Input
                  placeholder={t("templates.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                  flex="1"
                  border="none"
                  outline="none"
                  bg="transparent"
                />
                {searchQuery && (
                  <IconButton
                    aria-label={t("templates.clear")}
                    size="xs"
                    variant="ghost"
                    color="fg"
                    onClick={() => setSearchQuery("")}
                  >
                    <LuX />
                  </IconButton>
                )}
              </HStack>
            </Box>

            {/* カテゴリタブ */}
            <Tabs.Root
              value={activeCategory}
              onValueChange={(e) =>
                setActiveCategory(
                  e.value as PromptTemplate["category"] | "all",
                )}
              variant="enclosed"
              size="sm"
              flex="1"
              display="flex"
              flexDirection="column"
              minH={0}
            >
              <Tabs.List
                borderBottomWidth="1px"
                overflowX="auto"
                flexShrink={0}
                css={{
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    height: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "var(--chakra-colors-bg-muted)",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "var(--chakra-colors-border)",
                    borderRadius: "3px",
                  },
                }}
              >
                {categories.map((cat) => (
                  <Tabs.Trigger
                    key={cat.value}
                    value={cat.value}
                    fontSize="xs"
                    px={3}
                    py={2}
                    whiteSpace="nowrap"
                  >
                    {cat.label}
                    {cat.value === "all" && (
                      <Badge ml={1} size="xs">
                        {PROMPT_TEMPLATES.length}
                      </Badge>
                    )}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {/* テンプレートリスト */}
              <Box flex="1" overflowY="auto" p={4}>
                {filteredTemplates.length === 0
                  ? (
                    <EmptyState
                      icon={<LuFileText />}
                      title={t("templates.notFound")}
                      description={t("templates.notFoundDescription")}
                    />
                  )
                  : (
                    <VStack align="stretch" gap={2}>
                      {filteredTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => handleSelect(template.prompt)}
                        />
                      ))}
                    </VStack>
                  )}
              </Box>
            </Tabs.Root>
          </Dialog.Body>

          <Dialog.Footer>
            <Text fontSize="xs" color="fg.muted">
              {t("templates.footer")}
            </Text>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
