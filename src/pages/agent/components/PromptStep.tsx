/**
 * @fileoverview プロンプト入力ステップ - Claude風デザイン
 *
 * シンプルで余白を活かしたUI
 * カテゴリータブ付きプロンプトテンプレート選択
 *
 * @module pages/agent/components/PromptStep
 */

import React from "react";
import {
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
    MenuContent,
    MenuItem,
    MenuPositioner,
    MenuRoot,
    MenuTrigger,
    Portal,
    Spinner,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import {
    LuArrowUp,
    LuBriefcase,
    LuCode,
    LuFileText,
    LuMessageSquare,
    LuZap,
} from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";
import {
    getPromptTemplates,
    type PromptTemplate,
} from "@/lib/prompt-templates";

interface PromptStepProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    generating: boolean;
}

// カテゴリー定義（Claude風）
const CATEGORIES = [
    { id: "automation", icon: LuZap },
    { id: "data", icon: LuFileText },
    { id: "communication", icon: LuMessageSquare },
    { id: "development", icon: LuCode },
    { id: "other", icon: LuBriefcase },
] as const;

// カテゴリーラベル
const CATEGORY_LABELS: Record<string, string> = {
    automation: "自動化",
    data: "データ処理",
    communication: "コミュニケーション",
    development: "開発",
    other: "その他",
};

export function PromptStep({
    prompt,
    onPromptChange,
    onSubmit,
    generating,
}: PromptStepProps) {
    const { t } = useI18n();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const templates = React.useMemo(() => getPromptTemplates(t), [t]);

    // テキストエリアの高さを自動調整
    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [prompt]);

    // Cmd/Ctrl + Enter で送信
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    // テンプレート選択
    const handleSelectTemplate = (template: PromptTemplate) => {
        onPromptChange(template.prompt);
    };

    // カテゴリーごとにテンプレートをグループ化
    const templatesByCategory = React.useMemo(() => {
        return CATEGORIES.reduce((acc, category) => {
            acc[category.id] = templates.filter((t) => t.category === category.id);
            return acc;
        }, {} as Record<string, PromptTemplate[]>);
    }, [templates]);

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            h="full"
            minH={{ base: "auto", lg: "500px" }}
            px={{ base: 4, md: 6 }}
        >
            <VStack
                gap={{ base: 8, lg: 12 }}
                w="full"
                maxW="3xl"
                align="center"
            >
                {/* シンプルな挨拶 - Claude風 */}
                <VStack gap={2} textAlign="center">
                    <Text
                        fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                        fontWeight="normal"
                        color="fg"
                        letterSpacing="-0.02em"
                    >
                        {t("agent.whatToDo")}
                    </Text>
                </VStack>

                {/* 入力エリア - Claude風シンプルデザイン */}
                <Box w="full" position="relative">
                    <Box
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="2xl"
                        bg="bg"
                        transition="all 0.2s"
                        _focusWithin={{
                            borderColor: "fg.muted",
                            boxShadow: "0 0 0 1px var(--chakra-colors-border)",
                        }}
                        overflow="hidden"
                    >
                        {/* テキストエリア */}
                        <Textarea
                            ref={textareaRef}
                            placeholder={t("agent.placeholder")}
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={3}
                            minH="100px"
                            maxH="200px"
                            fontSize={{ base: "md", lg: "lg" }}
                            resize="none"
                            disabled={generating}
                            border="none"
                            borderRadius="none"
                            px={5}
                            pt={5}
                            pb={2}
                            _focus={{
                                boxShadow: "none",
                                outline: "none",
                            }}
                            _placeholder={{
                                color: "fg.muted",
                            }}
                        />

                        {/* 下部ツールバー */}
                        <Flex
                            justify="space-between"
                            align="center"
                            px={4}
                            py={3}
                        >
                            <Text fontSize="xs" color="fg.muted">
                                {t("agent.sendHint")}
                            </Text>

                            {/* 送信ボタン - Claude風 */}
                            <IconButton
                                aria-label={t("agent.generateWorkflow")}
                                onClick={onSubmit}
                                disabled={!prompt.trim() || generating}
                                size="sm"
                                borderRadius="lg"
                                bg={prompt.trim() ? "fg" : "bg.muted"}
                                color={prompt.trim() ? "bg" : "fg.muted"}
                                _hover={{
                                    bg: prompt.trim() ? "fg.muted" : "bg.muted",
                                }}
                                _disabled={{
                                    bg: "bg.muted",
                                    color: "fg.muted",
                                    cursor: "not-allowed",
                                    opacity: 0.5,
                                }}
                            >
                                {generating ? <Spinner size="sm" /> : <LuArrowUp />}
                            </IconButton>
                        </Flex>
                    </Box>
                </Box>

                {/* カテゴリーメニュー - コンパクトなドロップダウン */}
                <HStack
                    gap={1}
                    flexWrap="wrap"
                    justify="center"
                    py={2}
                >
                    {CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const categoryTemplates = templatesByCategory[category.id] || [];
                        
                        return (
                            <MenuRoot 
                                key={category.id} 
                                positioning={{ 
                                    placement: "bottom",
                                    flip: true,
                                    overflowPadding: 16,
                                }}
                            >
                                <MenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        borderRadius="full"
                                        px={4}
                                        py={2}
                                        color="fg.muted"
                                        fontWeight="normal"
                                        fontSize="sm"
                                        transition="all 0.15s"
                                        _hover={{
                                            bg: "bg.muted",
                                            color: "fg",
                                        }}
                                        disabled={generating}
                                    >
                                        <HStack gap={2}>
                                            <Icon size={16} />
                                            <Text>{CATEGORY_LABELS[category.id]}</Text>
                                        </HStack>
                                    </Button>
                                </MenuTrigger>
                                <Portal>
                                    <MenuPositioner>
                                        <MenuContent
                                            minW="280px"
                                            maxW="360px"
                                            maxH="50vh"
                                            overflowY="auto"
                                            borderRadius="xl"
                                            p={1}
                                            bg="bg"
                                            borderWidth="1px"
                                            borderColor="border"
                                            boxShadow="lg"
                                            zIndex="popover"
                                        >
                                    {categoryTemplates.length > 0 ? (
                                        categoryTemplates.map((template) => (
                                            <MenuItem
                                                key={template.id}
                                                value={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                borderRadius="lg"
                                                px={3}
                                                py={2}
                                                _hover={{
                                                    bg: "bg.muted",
                                                }}
                                            >
                                                <VStack align="start" gap={0.5} w="full">
                                                    <Text
                                                        fontWeight="medium"
                                                        fontSize="sm"
                                                        color="fg"
                                                    >
                                                        {template.title}
                                                    </Text>
                                                    <Text
                                                        fontSize="xs"
                                                        color="fg.muted"
                                                        lineClamp={2}
                                                    >
                                                        {template.description}
                                                    </Text>
                                                </VStack>
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <Box px={3} py={2}>
                                            <Text fontSize="sm" color="fg.muted">
                                                {t("agent.noTemplates")}
                                            </Text>
                                        </Box>
                                    )}
                                        </MenuContent>
                                    </MenuPositioner>
                                </Portal>
                            </MenuRoot>
                        );
                    })}
                </HStack>

                {/* フッター */}
                <Text
                    fontSize="xs"
                    color="fg.muted"
                    textAlign="center"
                    maxW="md"
                >
                    {t("agent.disclaimer") || "Sapphillon AI は間違いを起こすことがあります。重要な情報は確認してください。"}
                </Text>
            </VStack>
        </Flex>
    );
}
