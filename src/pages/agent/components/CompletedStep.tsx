/**
 * @fileoverview 完了ステップ - Claude風デザイン
 *
 * シンプルで控えめな完了画面
 *
 * @module pages/agent/components/CompletedStep
 */

import React from "react";
import {
    Box,
    Button,
    Flex,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
    LuArrowRight,
    LuCheck,
    LuHouse,
    LuRefreshCw,
} from "react-icons/lu";
import { TerminalConsole } from "@/components/console";
import type { TerminalConsoleHandle } from "@/components/console";
import type { GenerationEvent } from "@/components/console/utils";
import { useI18n } from "@/hooks/useI18n";
import { ConsoleToolbar } from "./ConsoleToolbar";

interface CompletedStepProps {
    workflowId: string | null;
    events: { t: number; kind: string; payload?: unknown }[];
    onReset: () => void;
    onViewWorkflow: () => void;
}

export function CompletedStep({
    workflowId,
    events,
    onReset,
    onViewWorkflow,
}: CompletedStepProps) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const consoleRef = React.useRef<TerminalConsoleHandle>(null);

    return (
        <VStack
            gap={{ base: 3, md: 6 }}
            w="full"
            maxW="3xl"
            mx="auto"
            align="stretch"
        >
            {/* シンプルな成功ヘッダー */}
            <VStack gap={3} textAlign="center" pt={{ base: 2, md: 6 }}>
                <Box
                    p={3}
                    rounded="full"
                    bg="green.100"
                    _dark={{ bg: "green.900/30", color: "green.400" }}
                    color="green.600"
                >
                    <LuCheck size={24} />
                </Box>
                <Text
                    fontSize="xl"
                    fontWeight="normal"
                    color="fg"
                >
                    {t("agent.completedTitle")}
                </Text>
                <Text color="fg.muted" fontSize="sm">
                    {t("agent.completedHint")}
                </Text>
            </VStack>

            {/* 実行結果 - シンプルなボーダー */}
            <Box
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                overflow="hidden"
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
                        />
                        <Text fontWeight="medium" fontSize="sm" color="fg.muted">
                            {t("agent.executionResult")}
                        </Text>
                    </HStack>
                    <ConsoleToolbar consoleRef={consoleRef} />
                </Flex>
                <Box
                    maxH="400px"
                    overflowY="auto"
                    bg="gray.950"
                    _light={{ bg: "gray.900" }}
                >
                    <TerminalConsole
                        ref={consoleRef}
                        events={events as GenerationEvent[]}
                        streaming={false}
                        compact={true}
                    />
                </Box>
            </Box>

            {/* アクションボタン - シンプル */}
            <Flex
                justify="center"
                gap={2}
                pt={2}
                wrap="wrap"
            >
                <Button
                    variant="ghost"
                    size={{ base: "sm", md: "md" }}
                    onClick={() => navigate("/home")}
                    borderRadius="lg"
                    color="fg.muted"
                    _hover={{ bg: "bg.muted" }}
                    flex="1"
                    minW={{ base: "calc(50% - 4px)", md: "auto" }}
                >
                    <LuHouse size={16} />
                    <Text ml={1}>{t("agent.backToHome")}</Text>
                </Button>
                {workflowId && (
                    <Button
                        variant="ghost"
                        size={{ base: "sm", md: "md" }}
                        onClick={onViewWorkflow}
                        borderRadius="lg"
                        color="fg.muted"
                        _hover={{ bg: "bg.muted" }}
                        flex="1"
                        minW={{ base: "calc(50% - 4px)", md: "auto" }}
                    >
                        <LuArrowRight size={16} />
                        <Text ml={1}>{t("agent.viewWorkflow")}</Text>
                    </Button>
                )}
                <Button
                    size={{ base: "sm", md: "md" }}
                    onClick={onReset}
                    borderRadius="lg"
                    bg="fg"
                    color="bg"
                    _hover={{ bg: "fg.muted" }}
                    flex="1"
                    minW={{ base: "calc(50% - 4px)", md: "auto" }}
                >
                    <LuRefreshCw size={16} />
                    <Text ml={1}>{t("agent.createAnother")}</Text>
                </Button>
            </Flex>
        </VStack>
    );
}
