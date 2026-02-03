/**
 * @fileoverview ステップインジケーター - Claude風デザイン
 *
 * シンプルなドット形式のプログレス表示
 *
 * @module pages/agent/components/StepIndicator
 */

import { Box, HStack, Text } from "@chakra-ui/react";
import { useI18n } from "@/hooks/useI18n";
import type { AgentStep } from "../useAgentExecution";

interface StepIndicatorProps {
    currentStep: AgentStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    const { t } = useI18n();

    const steps = [
        { key: "prompt", label: t("agent.step.prompt") },
        { key: "generating", label: t("agent.step.generating") },
        { key: "confirm", label: t("agent.step.confirm") },
        { key: "executing", label: t("agent.step.executing") },
        { key: "completed", label: t("agent.step.completed") },
    ];

    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    const activeIndex = currentStep === "error" ? -1 : currentIndex;

    return (
        <HStack
            justify="center"
            gap={2}
            py={4}
            display={{ base: "none", sm: "flex" }}
        >
            {steps.map((step, index) => (
                <HStack key={step.key} gap={2}>
                    {/* ドット */}
                    <Box
                        w={2}
                        h={2}
                        rounded="full"
                        bg={
                            index < activeIndex
                                ? "fg"
                                : index === activeIndex
                                ? "fg"
                                : "border"
                        }
                        opacity={index <= activeIndex ? 1 : 0.5}
                        transition="all 0.2s"
                    />
                    {/* 現在のステップのみラベル表示 */}
                    {index === activeIndex && (
                        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                            {step.label}
                        </Text>
                    )}
                    {/* セパレーター */}
                    {index < steps.length - 1 && index !== activeIndex && (
                        <Box
                            w={4}
                            h="1px"
                            bg="border"
                            opacity={0.5}
                        />
                    )}
                </HStack>
            ))}
        </HStack>
    );
}
