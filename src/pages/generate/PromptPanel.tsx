import {
  Badge,
  Button,
  HStack,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Separator,
  Spacer,
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
      <VStack align="stretch" gap={2}>
        <HStack gap={2} flexWrap="wrap" alignItems="center">
          <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
            {t("generate.prompt")}
          </Text>
          {characterCount > 0 && (
            <Badge colorPalette="gray" fontSize="xs">
              {characterCount} {t("generate.characters")}
            </Badge>
          )}
          <Spacer minW={2} />

          {/* 生成・停止ボタンのみ */}
          <HStack gap={1.5} alignItems="center">
            {/* 生成ボタン */}
            <Button
              size="sm"
              colorPalette="floorp"
              onClick={handleStart}
              disabled={!prompt.trim() || streaming}
              minH={{ base: "36px", md: "auto" }}
              flexShrink={0}
            >
              {streaming
                ? (
                  <HStack gap={1}>
                    <Spinner size="xs" />
                    <Text fontSize={{ base: "xs", sm: "sm" }}>
                      {t("generate.generating")}
                    </Text>
                  </HStack>
                )
                : (
                  <>
                    <LuSparkles size={14} />
                    <Text fontSize={{ base: "xs", sm: "sm" }}>
                      {t("common.generate")}
                    </Text>
                  </>
                )}
            </Button>

            {/* 停止ボタン */}
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={onStop}
              disabled={!streaming}
              minH={{ base: "36px", md: "auto" }}
              flexShrink={0}
            >
              <LuSquare size={14} />
              <Text fontSize={{ base: "xs", sm: "sm" }}>
                {t("generate.stop")}
              </Text>
            </Button>
          </HStack>
        </HStack>

        <Textarea
          rows={2}
          resize="none"
          placeholder={t("home.placeholder")}
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          fontSize={{ base: "sm", md: "md" }}
          minH={{ base: "60px", md: "100px" }}
          css={{
            "@media (min-width: 1024px)": {
              minHeight: "100px",
            },
          }}
        />

        {/* テンプレート・履歴・クリアボタン + ショートカットヒント */}
        <HStack justify="space-between" gap={2} flexWrap="wrap">
          <HStack gap={1} flexWrap="wrap">
            {/* テンプレートボタン */}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setTemplatesDialogOpen(true)}
            >
              <LuFileText size={12} />
              <Text fontSize="xs">{t("generate.template")}</Text>
            </Button>

            {/* 履歴ボタン（メニュー付き） */}
            <MenuRoot positioning={{ placement: "top-end" }}>
              <MenuTrigger asChild>
                <Button size="xs" variant="ghost">
                  <LuClock size={12} />
                  <Text fontSize="xs">{t("generate.history")}</Text>
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

            {/* クリアボタン */}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onChange("")}
              disabled={streaming || !prompt}
            >
              <LuEraser size={12} />
              <Text fontSize="xs">{t("generate.clear")}</Text>
            </Button>
          </HStack>

          {/* ショートカットヒント（デスクトップのみ） */}
          <Text
            fontSize="xs"
            color="fg.muted"
            display={{ base: "none", lg: "block" }}
          >
            {t("generate.executeHint")}
          </Text>
        </HStack>
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
