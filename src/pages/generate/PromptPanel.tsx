import {
  Badge,
  Box,
  Button,
  HStack,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuClock,
  LuEraser,
  LuFileText,
  LuSparkles,
  LuSquare,
} from "react-icons/lu";
import React from "react";
import { usePromptHistory } from "@/hooks/usePromptHistory";
import { PromptHistoryDialog } from "./PromptHistoryDialog";
import { PromptTemplatesDialog } from "./PromptTemplatesDialog";
import { useI18n } from "@/hooks/useI18n";

export function PromptPanel({
  prompt,
  onChange,
  onStart,
  onStop,
  streaming,
}: {
  prompt: string;
  onChange: (v: string) => void;
  onStart: () => void;
  onStop: () => void;
  streaming: boolean;
}) {
  const { t } = useI18n();
  const {
    history,
    starredHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    toggleStar,
  } = usePromptHistory();

  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [templatesDialogOpen, setTemplatesDialogOpen] = React.useState(false);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // IME変換中は無視
      if (e.nativeEvent.isComposing) {
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        prompt.trim() &&
        !streaming
      ) {
        e.preventDefault();
        onStart();
      }
    },
    [onStart, prompt, streaming],
  );

  const handleStart = React.useCallback(() => {
    if (prompt.trim()) {
      addToHistory(prompt);
      onStart();
    }
  }, [prompt, addToHistory, onStart]);

  const handleSelectHistoryPrompt = React.useCallback(
    (selectedPrompt: string) => {
      onChange(selectedPrompt);
    },
    [onChange],
  );

  const handleSelectTemplate = React.useCallback(
    (templatePrompt: string) => {
      onChange(templatePrompt);
    },
    [onChange],
  );

  const characterCount = prompt.length;

  // 最近の履歴（最大3件）をクイックアクセス用に取得
  const recentHistory = React.useMemo(() => history.slice(0, 3), [history]);

  return (
    <>
      <VStack align="stretch" gap={3}>
        {/* Claude.ai風の入力エリア */}
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="2xl"
          bg="bg"
          overflow="hidden"
          _focusWithin={{ borderColor: "fg.muted" }}
        >
          <Textarea
            rows={3}
            resize="none"
            placeholder={t("home.placeholder")}
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            fontSize={{ base: "sm", md: "md" }}
            border="none"
            _focus={{ boxShadow: "none", outline: "none" }}
            px={4}
            pt={3}
            pb={2}
          />

          {/* 入力バー下部のアクションエリア */}
          <HStack
            px={3}
            py={2}
            justify="space-between"
            bg="bg.subtle"
          >
            {/* 左側: テンプレート・履歴・クリア */}
            <HStack gap={1}>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setTemplatesDialogOpen(true)}
              >
                <LuFileText size={14} />
                <Text fontSize="xs" display={{ base: "none", md: "block" }}>
                  {t("generate.template")}
                </Text>
              </Button>

              <MenuRoot positioning={{ placement: "top-end" }}>
                <MenuTrigger asChild>
                  <Button size="xs" variant="ghost">
                    <LuClock size={14} />
                    <Text fontSize="xs" display={{ base: "none", md: "block" }}>
                      {t("generate.history")}
                    </Text>
                    {history.length > 0 && (
                      <Badge ml={0.5} size="xs" colorPalette="blue">
                        {history.length}
                      </Badge>
                    )}
                  </Button>
                </MenuTrigger>
                <Portal>
                  <MenuPositioner>
                    <MenuContent zIndex={1500}>
                      {recentHistory.length > 0
                        ? (
                          <>
                            {recentHistory.map((item) => (
                              <MenuItem
                                key={item.id}
                                value={item.id}
                                onClick={() =>
                                  handleSelectHistoryPrompt(item.prompt)}
                                fontSize="xs"
                                css={{
                                  maxWidth: "300px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.prompt}
                              </MenuItem>
                            ))}
                            <Separator />
                          </>
                        )
                        : null}
                      <MenuItem
                        value="view-all"
                        onClick={() => setHistoryDialogOpen(true)}
                        fontWeight="medium"
                        fontSize="xs"
                      >
                        <LuClock size={14} />
                        {t("generate.viewAllHistory")}
                      </MenuItem>
                    </MenuContent>
                  </MenuPositioner>
                </Portal>
              </MenuRoot>

              <Button
                size="xs"
                variant="ghost"
                onClick={() => onChange("")}
                disabled={streaming || !prompt}
              >
                <LuEraser size={14} />
                <Text fontSize="xs" display={{ base: "none", md: "block" }}>
                  {t("generate.clear")}
                </Text>
              </Button>

              {characterCount > 0 && (
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  ml={2}
                  display={{ base: "none", md: "block" }}
                >
                  {characterCount} {t("generate.characters")}
                </Text>
              )}
            </HStack>

            {/* 右側: 生成・停止ボタン */}
            <HStack gap={2}>
              {streaming && (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  onClick={onStop}
                  borderRadius="xl"
                >
                  <LuSquare size={14} />
                  <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
                    {t("generate.stop")}
                  </Text>
                </Button>
              )}
              <Button
                size="sm"
                colorPalette="floorp"
                onClick={handleStart}
                disabled={!prompt.trim() || streaming}
                borderRadius="xl"
                px={4}
              >
                {streaming
                  ? (
                    <HStack gap={1}>
                      <Spinner size="xs" />
                      <Text fontSize="xs">
                        {t("generate.generating")}
                      </Text>
                    </HStack>
                  )
                  : (
                    <>
                      <LuSparkles size={14} />
                      <Text
                        fontSize="xs"
                        display={{ base: "none", sm: "block" }}
                      >
                        {t("common.generate")}
                      </Text>
                    </>
                  )}
              </Button>
            </HStack>
          </HStack>
        </Box>
      </VStack>

      {/* 履歴ダイアログ */}
      <PromptHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={history}
        starredHistory={starredHistory}
        onSelectPrompt={handleSelectHistoryPrompt}
        onRemove={removeFromHistory}
        onToggleStar={toggleStar}
        onClear={clearHistory}
      />

      {/* テンプレートダイアログ */}
      <PromptTemplatesDialog
        open={templatesDialogOpen}
        onClose={() => setTemplatesDialogOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
}
