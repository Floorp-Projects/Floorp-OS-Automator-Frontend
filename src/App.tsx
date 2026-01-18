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

function App() {
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
        <Route path="/fix" element={<PageBox title="Fix" />} />
        <Route path="/run" element={<PageBox title="Run" />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/about" element={<PageBox title="About" />} />
      </Routes>
    </AppShell>
  );
}

import { Box, Text } from "@chakra-ui/react";
function PageBox({ title }: { title: string }) {
  return (
    <Box borderWidth="1px" rounded="md" p={4}>
      <Text fontWeight="medium">{title}</Text>
      <Text color="fg.muted">Mock content for {title} page.</Text>
    </Box>
  );
}

export default App;
