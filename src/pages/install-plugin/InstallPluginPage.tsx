import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster-instance";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clients } from "@/lib/grpc-clients";
import {
  LuCheck,
  LuCode,
  LuInfo,
  LuPackage,
  LuShieldAlert,
  LuUser,
  LuX,
} from "react-icons/lu";

// shadcn/ui inspired color tokens (dark theme)
const colors = {
  background: "hsl(240 10% 3.9%)",
  foreground: "hsl(0 0% 98%)",
  card: "hsl(240 10% 3.9%)",
  cardForeground: "hsl(0 0% 98%)",
  border: "hsl(240 3.7% 15.9%)",
  muted: "hsl(240 3.7% 15.9%)",
  mutedForeground: "hsl(240 5% 64.9%)",
  destructive: "hsl(0 62.8% 30.6%)",
  destructiveForeground: "hsl(0 0% 98%)",
  primary: "hsl(0 0% 98%)",
  primaryForeground: "hsl(240 5.9% 10%)",
  secondary: "hsl(240 3.7% 15.9%)",
  secondaryForeground: "hsl(0 0% 98%)",
  accent: "hsl(240 3.7% 15.9%)",
  ring: "hsl(240 4.9% 83.9%)",
  warning: "hsl(38 92% 50%)",
  warningBg: "hsl(38 92% 50% / 0.15)",
  warningBorder: "hsl(38 92% 50% / 0.3)",
};

interface PluginInfo {
  uri: string;
  id?: string;
  name?: string;
  author?: string;
  version?: string;
  description?: string;
  functions?: PluginFunction[];
  category?: string;
  isOfficial?: boolean;
}

interface PluginFunction {
  name: string;
  description: string;
  parameters?: string[];
}

type InstallStatus = "confirm" | "installing" | "success" | "error";

// Parse functions from query params (JSON encoded)
function parseFunctionsFromParams(
  params: URLSearchParams,
): PluginFunction[] | undefined {
  const functionsJson = params.get("functions");
  console.log("[InstallPluginPage] Raw functions param:", functionsJson);
  if (!functionsJson) return undefined;
  try {
    // URLSearchParams.get() already decodes, but Floorp double-encodes with encodeURIComponent
    // So we need to decode once more
    const decoded = decodeURIComponent(functionsJson);
    console.log("[InstallPluginPage] Decoded functions:", decoded);
    const parsed = JSON.parse(decoded);
    console.log("[InstallPluginPage] Parsed functions:", parsed);
    return parsed;
  } catch (e) {
    console.error("[InstallPluginPage] Failed to parse functions:", e);
    // Try parsing directly without additional decode (in case it wasn't double-encoded)
    try {
      const parsed = JSON.parse(functionsJson);
      console.log("[InstallPluginPage] Parsed functions (direct):", parsed);
      return parsed;
    } catch {
      return undefined;
    }
  }
}

export function InstallPluginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pluginInfo, setPluginInfo] = useState<PluginInfo | null>(null);
  const [status, setStatus] = useState<InstallStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    console.log("[InstallPluginPage] Mounted");
    console.log("[InstallPluginPage] Full URL:", window.location.href);
    console.log("[InstallPluginPage] All params:", Object.fromEntries(searchParams.entries()));
    const uri = searchParams.get("uri");
    console.log("[InstallPluginPage] URI from params:", uri);

    if (!uri) {
      setStatus("error");
      setErrorMessage("No plugin URI provided");
      return;
    }

    const parsedFunctions = parseFunctionsFromParams(searchParams);
    console.log("[InstallPluginPage] Final parsed functions:", parsedFunctions);

    setPluginInfo({
      uri,
      id: searchParams.get("id") || undefined,
      name: searchParams.get("name") || undefined,
      author: searchParams.get("author") || undefined,
      version: searchParams.get("version") || undefined,
      description: searchParams.get("description") || undefined,
      category: searchParams.get("category") || "utilities",
      isOfficial: searchParams.get("isOfficial") === "true",
      functions: parsedFunctions,
    });
  }, [searchParams]);

  const handleInstall = async () => {
    console.log("[InstallPluginPage] Install button clicked");
    if (!pluginInfo) return;

    setStatus("installing");
    try {
      console.log(
        "[InstallPluginPage] Calling installPlugin with URI:",
        pluginInfo.uri,
      );
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

  const handleOpenDetails = () => {
    const detailsUrl = pluginInfo?.uri ||
      `https://floorp.app/plugins/${pluginInfo?.id || "unknown"}`;
    window.open(detailsUrl, "_blank");
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    browser: "ブラウザ",
    system: "システム",
    productivity: "生産性",
    developer: "開発ツール",
    communication: "通信",
    media: "メディア",
    utilities: "ユーティリティ",
  };

  // Get category label
  const getCategoryLabel = (category?: string) => {
    return categoryLabels[category || "utilities"] || category ||
      "ユーティリティ";
  };

  // エラー状態でプラグイン情報がない場合
  if (status === "error" && !pluginInfo) {
    return (
      <Flex
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.8)"
        align="center"
        justify="center"
        zIndex={999999}
      >
        <Box
          bg={colors.background}
          border="1px solid"
          borderColor={colors.border}
          borderRadius="8px"
          p={6}
          minW="400px"
          maxW="550px"
        >
          <VStack gap={4} align="center">
            <Box color="red.400">
              <Icon as={LuX} boxSize={12} />
            </Box>
            <Text color={colors.foreground} fontWeight="600" fontSize="lg">
              エラーが発生しました
            </Text>
            <Text color={colors.mutedForeground} textAlign="center">
              {errorMessage}
            </Text>
            <Button
              bg={colors.primary}
              color={colors.primaryForeground}
              _hover={{ bg: "hsl(0 0% 90%)" }}
              h="36px"
              px={4}
              borderRadius="6px"
              fontWeight="500"
              onClick={handleCancel}
            >
              プラグイン一覧へ
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.8)"
      align="center"
      justify="center"
      zIndex={999999}
      onClick={(e) => {
        if (e.target === e.currentTarget && status === "confirm") {
          handleCancel();
        }
      }}
    >
      {/* shadcn/ui style dialog */}
      <Box
        bg={colors.background}
        border="1px solid"
        borderColor={colors.border}
        borderRadius="8px"
        p={6}
        minW="550px"
        maxW="650px"
        maxH="80vh"
        overflowY="auto"
        boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)"
        display="flex"
        flexDirection="column"
        gap={6}
        fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Heading
          as="h2"
          fontSize="18px"
          fontWeight="600"
          color={colors.foreground}
          letterSpacing="-0.025em"
          lineHeight="1"
        >
          Floorp OS プラグインをインストール
        </Heading>

        {/* Plugin Info Section */}
        <Flex align="flex-start" gap={4} py={3}>
          {/* Icon */}
          <Flex
            w="64px"
            h="64px"
            minW="64px"
            borderRadius="6px"
            bg={colors.muted}
            align="center"
            justify="center"
          >
            <Icon as={LuPackage} boxSize={10} color="blue.400" />
          </Flex>

          {/* Details */}
          <VStack align="start" gap={1} flex={1}>
            <Text
              fontSize="16px"
              fontWeight="500"
              color={colors.foreground}
              letterSpacing="-0.01em"
            >
              {pluginInfo?.name || "不明なプラグイン"}
            </Text>

            {/* Author, Version, Official badge, Category */}
            <HStack
              gap={2}
              flexWrap="wrap"
              fontSize="14px"
              color={colors.mutedForeground}
            >
              {pluginInfo?.author && (
                <HStack gap={1}>
                  <Icon as={LuUser} boxSize={3.5} />
                  <Text>作成者: {pluginInfo.author}</Text>
                </HStack>
              )}
              {pluginInfo?.version && (
                <Badge
                  bg={colors.muted}
                  color={colors.mutedForeground}
                  px={2}
                  py={0.5}
                  borderRadius="9999px"
                  fontSize="12px"
                  fontWeight="500"
                >
                  v{pluginInfo.version}
                </Badge>
              )}
              {pluginInfo?.isOfficial && (
                <Badge
                  bg={colors.primary}
                  color={colors.primaryForeground}
                  px={2}
                  py={0.5}
                  borderRadius="9999px"
                  fontSize="12px"
                  fontWeight="500"
                >
                  <HStack gap={1}>
                    <Icon as={LuCheck} boxSize={3} />
                    <span>公式</span>
                  </HStack>
                </Badge>
              )}
              <Badge
                bg="transparent"
                color={colors.mutedForeground}
                border="1px solid"
                borderColor={colors.border}
                px={2}
                py={0.5}
                borderRadius="9999px"
                fontSize="12px"
                fontWeight="500"
              >
                {getCategoryLabel(pluginInfo?.category)}
              </Badge>
            </HStack>
          </VStack>
        </Flex>

        {/* Description */}
        {pluginInfo?.description && (
          <Text
            fontSize="14px"
            lineHeight="1.6"
            color={colors.mutedForeground}
          >
            {pluginInfo.description}
          </Text>
        )}

        {/* Functions / Permissions Section */}
        {pluginInfo?.functions && pluginInfo.functions.length > 0 && (
          <VStack align="stretch" gap={3}>
            {/* Section header */}
            <HStack
              gap={2}
              fontSize="14px"
              fontWeight="500"
              color={colors.foreground}
            >
              <Icon as={LuCode} boxSize={4} opacity={0.8} />
              <Text>
                このプラグインが提供・アクセスする機能 ({pluginInfo.functions
                  .length})
              </Text>
            </HStack>

            {/* Functions list */}
            <Box
              bg={colors.background}
              border="1px solid"
              borderColor={colors.border}
              borderRadius="6px"
              p={1}
              maxH="200px"
              overflowY="auto"
            >
              <VStack align="stretch" gap="1px">
                {pluginInfo.functions.map((func, index) => (
                  <Box
                    key={index}
                    p={3}
                    borderRadius="4px"
                    bg="transparent"
                    _hover={{ bg: colors.muted }}
                    transition="background 0.15s"
                  >
                    <VStack align="start" gap={0.5}>
                      <Text
                        fontSize="13px"
                        fontWeight="500"
                        color={colors.foreground}
                        fontFamily='ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                      >
                        {func.name}
                      </Text>
                      {func.description && (
                        <Text
                          fontSize="12px"
                          color={colors.mutedForeground}
                          lineHeight="1.4"
                        >
                          {func.description}
                        </Text>
                      )}
                      {func.parameters && func.parameters.length > 0 && (
                        <HStack gap={1} mt={1} flexWrap="wrap">
                          {func.parameters.map((param, pidx) => (
                            <Badge
                              key={pidx}
                              bg={colors.muted}
                              color={colors.mutedForeground}
                              px={1.5}
                              py={0.5}
                              borderRadius="4px"
                              fontSize="11px"
                              fontFamily='ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace'
                            >
                              {param}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          </VStack>
        )}

        {/* Warning Message - shadcn/ui destructive style */}
        <HStack
          align="flex-start"
          gap={3}
          p={4}
          bg={colors.warningBg}
          border="1px solid"
          borderColor={colors.warningBorder}
          borderRadius="6px"
        >
          <Icon
            as={LuShieldAlert}
            boxSize={4}
            color={colors.warning}
            flexShrink={0}
            mt={0.5}
          />
          <Text fontSize="13px" lineHeight="1.5" color={colors.foreground}>
            このプラグインは Floorp OS
            の機能を拡張します。信頼できる提供元からのみインストールしてください。
          </Text>
        </HStack>

        {/* Buttons - shadcn/ui style */}
        {status === "confirm" && (
          <HStack
            gap={2}
            pt={4}
            mt={2}
            borderTop="1px solid"
            borderColor={colors.border}
            justify="flex-end"
          >
            {/* Details button - left aligned */}
            <Button
              h="36px"
              px={4}
              borderRadius="6px"
              border="1px solid"
              borderColor={colors.border}
              bg="transparent"
              color={colors.mutedForeground}
              fontSize="14px"
              fontWeight="500"
              mr="auto"
              _hover={{
                bg: colors.muted,
                borderColor: "hsl(240 5% 26%)",
                color: colors.foreground,
              }}
              onClick={handleOpenDetails}
            >
              <Icon as={LuInfo} boxSize={3.5} mr={1.5} />
              詳細情報
            </Button>

            {/* Cancel button */}
            <Button
              h="36px"
              px={4}
              borderRadius="6px"
              border="1px solid"
              borderColor={colors.border}
              bg="transparent"
              color={colors.foreground}
              fontSize="14px"
              fontWeight="500"
              _hover={{
                bg: colors.muted,
                borderColor: "hsl(240 5% 26%)",
              }}
              onClick={handleCancel}
            >
              キャンセル
            </Button>

            {/* Install button - primary */}
            <Button
              h="36px"
              px={4}
              borderRadius="6px"
              border="none"
              bg={colors.primary}
              color={colors.primaryForeground}
              fontSize="14px"
              fontWeight="500"
              _hover={{ bg: "hsl(0 0% 90%)" }}
              onClick={handleInstall}
            >
              追加
            </Button>
          </HStack>
        )}

        {/* Installing state */}
        {status === "installing" && (
          <VStack gap={4} py={6}>
            <Spinner size="lg" color={colors.foreground} />
            <Text fontSize="14px" color={colors.mutedForeground}>
              プラグインをインストール中...
            </Text>
          </VStack>
        )}

        {/* Success state */}
        {status === "success" && (
          <VStack gap={4} py={6}>
            <Flex
              w="64px"
              h="64px"
              borderRadius="full"
              bg="hsl(142.1 76.2% 36.3% / 0.15)"
              align="center"
              justify="center"
            >
              <Icon as={LuCheck} boxSize={8} color="hsl(142.1 76.2% 36.3%)" />
            </Flex>
            <VStack gap={1}>
              <Text fontSize="16px" fontWeight="500" color={colors.foreground}>
                プラグインがインストールされました！
              </Text>
              <Text fontSize="14px" color={colors.mutedForeground}>
                プラグインリストで確認できます
              </Text>
            </VStack>
            <Button
              h="36px"
              px={4}
              borderRadius="6px"
              bg={colors.primary}
              color={colors.primaryForeground}
              fontSize="14px"
              fontWeight="500"
              _hover={{ bg: "hsl(0 0% 90%)" }}
              onClick={() => navigate("/plugins")}
            >
              プラグイン一覧へ
            </Button>
          </VStack>
        )}

        {/* Error state */}
        {status === "error" && (
          <VStack gap={4} py={6}>
            <Flex
              w="64px"
              h="64px"
              borderRadius="full"
              bg="hsl(0 62.8% 30.6% / 0.15)"
              align="center"
              justify="center"
            >
              <Icon as={LuX} boxSize={8} color="hsl(0 62.8% 60%)" />
            </Flex>
            <VStack gap={1}>
              <Text fontSize="16px" fontWeight="500" color="hsl(0 62.8% 60%)">
                インストールに失敗しました
              </Text>
              <Text
                fontSize="14px"
                color={colors.mutedForeground}
                textAlign="center"
              >
                {errorMessage}
              </Text>
            </VStack>
            <HStack gap={2}>
              <Button
                h="36px"
                px={4}
                borderRadius="6px"
                border="1px solid"
                borderColor={colors.border}
                bg="transparent"
                color={colors.foreground}
                fontSize="14px"
                fontWeight="500"
                _hover={{
                  bg: colors.muted,
                  borderColor: "hsl(240 5% 26%)",
                }}
                onClick={handleCancel}
              >
                キャンセル
              </Button>
              <Button
                h="36px"
                px={4}
                borderRadius="6px"
                bg={colors.primary}
                color={colors.primaryForeground}
                fontSize="14px"
                fontWeight="500"
                _hover={{ bg: "hsl(0 0% 90%)" }}
                onClick={handleInstall}
              >
                再試行
              </Button>
            </HStack>
          </VStack>
        )}
      </Box>
    </Flex>
  );
}

export default InstallPluginPage;
