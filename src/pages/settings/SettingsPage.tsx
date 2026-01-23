import { Box, Tabs } from "@chakra-ui/react";
import { ProvidersPage } from "./ProvidersPage";
import { ModelsPage } from "./ModelsPage";
import { useI18n } from "@/hooks/useI18n";

export function SettingsPage() {
    const { t } = useI18n();
    return (
        <Box h="full" overflow="auto" p={4}>
            <Tabs.Root defaultValue="providers" variant="enclosed">
                <Tabs.List>
                    <Tabs.Trigger value="providers">
                        {t("settings.providers")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="models">
                        {t("settings.models")}
                    </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="providers">
                    <ProvidersPage />
                </Tabs.Content>

                <Tabs.Content value="models">
                    <ModelsPage />
                </Tabs.Content>
            </Tabs.Root>
        </Box>
    );
}
