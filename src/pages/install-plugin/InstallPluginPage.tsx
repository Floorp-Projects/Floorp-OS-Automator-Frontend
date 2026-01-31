import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster-instance";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clients } from "@/lib/grpc-clients";

interface PluginInfo {
  uri: string;
  id?: string;
  name?: string;
  author?: string;
  version?: string;
  description?: string;
}

type InstallStatus = "confirm" | "installing" | "success" | "error";

export function InstallPluginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pluginInfo, setPluginInfo] = useState<PluginInfo | null>(null);
  const [status, setStatus] = useState<InstallStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    console.log("[InstallPluginPage] Mounted");
    const uri = searchParams.get("uri");
    console.log("[InstallPluginPage] URI from params:", uri);
    
    if (!uri) {
      setStatus("error");
      setErrorMessage("No plugin URI provided");
      return;
    }

    setPluginInfo({
      uri,
      id: searchParams.get("id") || undefined,
      name: searchParams.get("name") || undefined,
      author: searchParams.get("author") || undefined,
      version: searchParams.get("version") || undefined,
      description: searchParams.get("description") || undefined,
    });
  }, [searchParams]);

  const handleInstall = async () => {
    console.log("[InstallPluginPage] Install button clicked");
    if (!pluginInfo) return;

    setStatus("installing");
    try {
      console.log("[InstallPluginPage] Calling installPlugin with URI:", pluginInfo.uri);
      const response = await clients.plugin.installPlugin({
        uri: pluginInfo.uri,
      });
      console.log("[InstallPluginPage] Response:", response);

      // Check for error - code 0 is OK, or no status means success
      if (response.status && response.status.code !== 0) {
        throw new Error(response.status.message || "Installation failed");
      }

      setStatus("success");
      toaster.create({
        title: "Plugin installed",
        description: pluginInfo.name || pluginInfo.uri,
        type: "success",
      });
      
      // Auto-redirect to plugins page after 2 seconds
      setTimeout(() => {
        navigate("/plugins");
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[InstallPluginPage] Failed:", error);
      
      // Treat "already installed" as success
      if (errorMsg.includes("already installed")) {
        setStatus("success");
        toaster.create({
          title: "Plugin already installed",
          description: pluginInfo.name || pluginInfo.uri,
          type: "success",
        });
        // Auto-redirect to plugins page after 2 seconds
        setTimeout(() => {
          navigate("/plugins");
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(errorMsg);
        toaster.create({
          title: "Installation failed",
          description: errorMsg,
          type: "error",
        });
      }
    }
  };

  const handleCancel = () => {
    navigate("/plugins");
  };

  console.log("[InstallPluginPage] Render - status:", status, "pluginInfo:", pluginInfo);

  if (status === "error" && !pluginInfo) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack gap={4}>
          <Heading size="md">Error</Heading>
          <Text>{errorMessage}</Text>
          <Button onClick={handleCancel}>Go to Plugins</Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack gap={6} align="stretch">
        <Heading size="lg">Install Plugin</Heading>
        
        {pluginInfo && (
          <Box p={4} borderWidth="1px" borderRadius="md">
            <VStack align="start" gap={2}>
              <Text fontWeight="bold">{pluginInfo.name || "Unknown Plugin"}</Text>
              {pluginInfo.author && <Text>Author: {pluginInfo.author}</Text>}
              {pluginInfo.version && <Text>Version: {pluginInfo.version}</Text>}
              <Text fontSize="sm" color="fg.muted">URI: {pluginInfo.uri}</Text>
            </VStack>
          </Box>
        )}

        {status === "confirm" && (
          <HStack gap={3} justify="flex-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button colorPalette="blue" onClick={handleInstall}>
              Install Plugin
            </Button>
          </HStack>
        )}

        {status === "installing" && (
          <HStack gap={3} justify="center" py={4}>
            <Spinner size="md" />
            <Text>Installing plugin...</Text>
          </HStack>
        )}

        {status === "success" && (
          <VStack gap={4} align="center" py={4}>
            <Text color="green.500" fontWeight="medium">
              Plugin installed successfully!
            </Text>
            <Button colorPalette="blue" onClick={() => navigate("/plugins")}>
              Go to Plugins
            </Button>
          </VStack>
        )}

        {status === "error" && (
          <VStack gap={4} align="center" py={4}>
            <Text color="red.500" fontWeight="medium">
              Installation failed: {errorMessage}
            </Text>
            <HStack gap={3}>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button colorPalette="blue" onClick={handleInstall}>
                Retry
              </Button>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Container>
  );
}

export default InstallPluginPage;
