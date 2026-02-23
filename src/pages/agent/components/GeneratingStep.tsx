/**
 * @fileoverview 生成中ステップ - Claude風デザイン
 *
 * シンプルで控えめな進捗表示
 *
 * @module pages/agent/components/GeneratingStep
 */

import React from "react";
import {
    Box,
    Button,
    Flex,
    HStack,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { LuSquare } from "react-icons/lu";
import { TerminalConsole } from "@/components/console";
import type { TerminalConsoleHandle } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { useI18n } from "@/hooks/useI18n";
import { ConsoleToolbar } from "./ConsoleToolbar";

interface GeneratingStepProps {
    events: { t: number; kind: string; payload?: unknown }[];
    onStop: () => void;
}

export function GeneratingStep({ events, onStop }: GeneratingStepProps) {
    const { t } = useI18n();
    const consoleRef = React.useRef<TerminalConsoleHandle>(null);

    return (
        <VStack
            gap={{ base: 3, md: 6 }}
            w="full"
            maxW="3xl"
            mx="auto"
            align="stretch"
            h="full"
        >
            {/* シンプルなヘッダー */}
            <VStack gap={3} textAlign="center" pt={{ base: 2, md: 6 }}>
                <Spinner
                    size="lg"
                    color="fg.muted"
                    borderWidth="2px"
                />
                <Text
                    fontSize="xl"
                    fontWeight="normal"
                    color="fg"
                >
                    {t("agent.generatingTitle")}
                </Text>
                <Text color="fg.muted" fontSize="sm">
                    {t("agent.generatingHint")}
                </Text>
            </VStack>

            {/* コンソール - シンプルなボーダー */}
            <Box
                flex={1}
                minH={0}
                overflow="hidden"
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg"
            >
                <Flex
                    justify="space-between"
                    align="center"
                    px={4}
                    py={3}
                    borderBottomWidth="1px"
                    borderColor="border"
                >
                    <HStack gap={2}>
                        <Box
                            w={2}
                            h={2}
                            rounded="full"
                            bg="green.500"
                            animation="blink 1s infinite"
                            css={{
                                "@keyframes blink": {
                                    "0%, 100%": { opacity: 1 },
                                    "50%": { opacity: 0.3 },
                                },
                            }}
                        />
                        <Text
                            fontWeight="medium"
                            fontSize="sm"
                            color="fg.muted"
                        >
                            {t("agent.generationLog")}
                        </Text>
                    </HStack>
                    <HStack gap={2}>
                        <ConsoleToolbar consoleRef={consoleRef} />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onStop}
                            borderRadius="lg"
                            color="fg.muted"
                            _hover={{
                                bg: "bg.muted",
                                color: "red.500",
                            }}
                        >
                            <LuSquare size={14} />
                            <Text ml={1}>{t("agent.stop")}</Text>
                        </Button>
                    </HStack>
                </Flex>
                <Box
                    h="calc(100% - 52px)"
                    overflow="hidden"
                    bg="gray.950"
                    _light={{ bg: "gray.50" }}
                >
                    <TerminalConsole
                        ref={consoleRef}
                        events={events as GenerationEvent[]}
                        streaming={true}
                        compact={true}
                    />
                </Box>
            </Box>
        </VStack>
    );
}
