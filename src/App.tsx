import { AppShell } from "@/components/layout/AppShell";
import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/home/Home";
import { GeneratePage } from "@/pages/generate/GeneratePage";
import { AgentPage } from "@/pages/agent";
import {
  WorkflowParserTest,
  WorkflowRunPage,
  WorkflowsPage,
} from "@/pages/workflows";
import { PluginsPage } from "@/pages/plugins";
import { SettingsPage } from "@/pages/settings";
import { useI18n } from "@/hooks/useI18n";

function App() {
  const { t } = useI18n();
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/:id" element={<WorkflowRunPage />} />
        <Route path="/workflows-parser-test" element={<WorkflowParserTest />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/fix" element={<PageBox title={t("pages.fix")} />} />
        <Route path="/run" element={<PageBox title={t("pages.run")} />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/about" element={<PageBox title={t("pages.about")} />} />
      </Routes>
    </AppShell>
  );
}

import { Box, Text } from "@chakra-ui/react";
function PageBox({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <Box borderWidth="1px" rounded="md" p={4}>
      <Text fontWeight="medium">{title}</Text>
      <Text color="fg.muted">{t("pages.mockContent", { title })}</Text>
    </Box>
  );
}

export default App;
