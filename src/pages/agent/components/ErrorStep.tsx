/**
 * @fileoverview エラーステップ - Claude風デザイン
 *
 * シンプルで控えめなエラー表示
 *
 * @module pages/agent/components/ErrorStep
 */

import {
    Box,
    Button,
    Flex,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { LuArrowLeft, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";

interface ErrorStepProps {
    error: string | null;
    onRetry: () => void;
    onReset: () => void;
}

export function ErrorStep({ error, onRetry, onReset }: ErrorStepProps) {
    const { t } = useI18n();

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            h="full"
            minH={{ base: "auto", lg: "400px" }}
        >
            <VStack
                gap={{ base: 3, md: 6 }}
                w="full"
                maxW="xl"
                align="stretch"
            >
                {/* シンプルなエラーヘッダー */}
                <VStack gap={3} textAlign="center" pt={{ base: 2, md: 6 }}>
                    <Box
                        p={3}
                        rounded="full"
                        bg="red.100"
                        _dark={{ bg: "red.900/30", color: "red.400" }}
                        color="red.600"
                    >
                        <LuTriangleAlert size={24} />
                    </Box>
                    <Text
                        fontSize="xl"
                        fontWeight="normal"
                        color="fg"
                    >
                        {t("agent.errorTitle")}
                    </Text>
                    <Text color="fg.muted" fontSize="sm">
                        {t("agent.errorHint")}
                    </Text>
                </VStack>

                {/* エラー詳細 - シンプルなボーダー */}
                <Box
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="xl"
                    overflow="hidden"
                    bg="bg"
                >
                    <Flex
                        align="center"
                        gap={2}
                        px={4}
                        py={3}
                        borderBottomWidth="1px"
                        borderColor="border"
                    >
                        <Box
                            w={2}
                            h={2}
                            rounded="full"
                            bg="red.500"
                        />
                        <Text fontWeight="medium" fontSize="sm" color="fg.muted">
                            {t("agent.errorDetails")}
                        </Text>
                    </Flex>
                    <Box
                        p={4}
                        fontFamily="mono"
                        fontSize="sm"
                        color="fg.muted"
                        wordBreak="break-word"
                        whiteSpace="pre-wrap"
                        maxH="200px"
                        overflowY="auto"
                        bg="bg.muted"
                    >
                        {error || t("agent.unknownError")}
                    </Box>
                </Box>

                {/* アクションボタン - シンプル */}
                <HStack justify="center" gap={3} pt={2}>
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={onReset}
                        borderRadius="lg"
                        color="fg.muted"
                        _hover={{ bg: "bg.muted" }}
                    >
                        <LuArrowLeft size={16} />
                        <Text ml={1}>{t("agent.startOver")}</Text>
                    </Button>
                    <Button
                        size="md"
                        onClick={onRetry}
                        borderRadius="lg"
                        bg="fg"
                        color="bg"
                        _hover={{ bg: "fg.muted" }}
                    >
                        <LuRefreshCw size={16} />
                        <Text ml={1}>{t("agent.retry")}</Text>
                    </Button>
                </HStack>
            </VStack>
        </Flex>
    );
}
