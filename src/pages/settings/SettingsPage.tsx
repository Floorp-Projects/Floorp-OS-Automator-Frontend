import { Box, Flex, Heading, HStack, IconButton, Tabs } from "@chakra-ui/react";
import { LuArrowLeft } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { ProvidersPage } from "./ProvidersPage";
import { ModelsPage } from "./ModelsPage";
import { useI18n } from "@/hooks/useI18n";

export function SettingsPage() {
    const { t } = useI18n();
    const navigate = useNavigate();

    return (
        <Flex direction="column" h="full" overflow="hidden" fontSize="md">
            {/* Header */}
            <Box
                borderBottomWidth="1px"
                px={3}
                py={2}
                bg="bg.panel"
                flexShrink={0}
            >
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <IconButton
                            aria-label={t("common.back")}
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate("/home")}
                        >
                            <LuArrowLeft />
                        </IconButton>
                        <Heading size="sm">{t("settings.title")}</Heading>
                    </HStack>
                </HStack>
            </Box>

            {/* Content */}
            <Box flex={1} overflow="auto">
                <Tabs.Root defaultValue="providers" variant="line">
                    <Tabs.List
                        px={4}
                        pt={3}
                        bg="bg.panel"
                        borderBottomWidth="1px"
                    >
                        <Tabs.Trigger
                            value="providers"
                            fontSize="sm"
                            fontWeight="medium"
                            px={4}
                            py={2}
                        >
                            {t("settings.providers")}
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="models"
                            fontSize="sm"
                            fontWeight="medium"
                            px={4}
                            py={2}
                        >
                            {t("settings.models")}
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="providers" pt={0}>
                        <ProvidersPage />
                    </Tabs.Content>

                    <Tabs.Content value="models" pt={0}>
                        <ModelsPage />
                    </Tabs.Content>
                </Tabs.Root>
            </Box>
        </Flex>
    );
}
