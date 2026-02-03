import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuArrowLeft, LuExternalLink, LuShield } from "react-icons/lu";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { clients } from "@/lib/grpc-clients";
import type {
  PluginFunction,
  PluginPackage,
} from "@/gen/sapphillon/v1/plugin_pb";

export function PluginDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  // Use wildcard parameter to support packageIds with slashes (e.g., sapphillon/schedule-utils/1.0.0)
  const packageId = params["*"] || params["packageId"];
  const navigate = useNavigate();
  const location = useLocation();

  const [plugin, setPlugin] = React.useState<PluginPackage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "functions" | "permissions"
  >("overview");

  // Fetch plugin data
  const fetchPlugin = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      // Strategy 1: Check router state (fast, no API call)
      const state = location.state as { plugin?: PluginPackage } | null;
      if (state?.plugin && state.plugin.packageId === id) {
        setPlugin(state.plugin);
        setLoading(false);
        return;
      }

      // Strategy 2: Fallback - fetch all and filter
      try {
        const response = await clients.plugin.listPlugins({ pageSize: 100 });
        const found = response.plugins.find((p) => p.packageId === id);

        if (found) {
          setPlugin(found);
        } else {
          setError(t("pluginDetail.error.notFound"));
        }
      } catch (e) {
        console.error("Failed to fetch plugin:", e);
        setError(t("pluginDetail.error.title"));
      } finally {
        setLoading(false);
      }
    },
    [location.state, t],
  );

  React.useEffect(() => {
    if (packageId) {
      fetchPlugin(packageId);
    }
  }, [packageId, fetchPlugin]);

  // Format timestamp
  const formatDate = React.useCallback(
    (timestamp?: { seconds: bigint; nanos: number }) => {
      if (!timestamp) return "-";
      const date = new Date(Number(timestamp.seconds) * 1000);
      return date.toLocaleString();
    },
    [],
  );

  if (loading) {
    return (
      <Flex h="full" align="center" justify="center">
        <VStack gap={4}>
          <Spinner size="lg" />
          <Text color="fg.muted">{t("pluginDetail.loading")}</Text>
        </VStack>
      </Flex>
    );
  }

  if (error || !plugin) {
    return (
      <Flex h="full" align="center" justify="center">
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <Text color="red.500" fontWeight="medium">
                {t("pluginDetail.error.title")}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {error || t("pluginDetail.error.description")}
              </Text>
              <Button onClick={() => navigate("/plugins")}>
                {t("pluginDetail.backToPlugins")}
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Flex>
    );
  }

  const isVerified = plugin.verified;
  const isInternal = plugin.internalPlugin;
  const isDeprecated = plugin.deprecated;
  // Detect external plugins (incomplete metadata)
  const isExternal = !isInternal && plugin.functions.length === 0 &&
    plugin.description === "External plugin";

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
        <HStack justify="space-between" align="start" gap={2}>
          <HStack gap={2} minW={0} flex={1}>
            <IconButton
              aria-label={t("common.back")}
              variant="ghost"
              size="xs"
              onClick={() => navigate("/plugins")}
              flexShrink={0}
            >
              <LuArrowLeft />
            </IconButton>
            <VStack align="start" gap={1} minW={0} flex={1}>
              <HStack gap={2} flexWrap="wrap">
                <Heading size="sm" lineClamp={1}>
                  {plugin.packageName}
                </Heading>
                <Badge variant="outline" fontSize="xs" flexShrink={0}>
                  v{plugin.packageVersion}
                </Badge>
                {isExternal && (
                  <Badge colorPalette="gray" fontSize="xs" flexShrink={0}>
                    外部プラグイン
                  </Badge>
                )}
                {isVerified && (
                  <Badge colorPalette="blue" fontSize="xs" flexShrink={0}>
                    <LuShield size={12} />
                    {t("plugins.verified")}
                  </Badge>
                )}
                {isInternal && (
                  <Badge colorPalette="purple" fontSize="xs" flexShrink={0}>
                    {t("plugins.internal")}
                  </Badge>
                )}
                {isDeprecated && (
                  <Badge colorPalette="orange" fontSize="xs" flexShrink={0}>
                    {t("plugins.deprecated")}
                  </Badge>
                )}
              </HStack>
              {plugin.description && !isExternal && (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {plugin.description}
                </Text>
              )}
            </VStack>
          </HStack>
          {plugin.pluginStoreUrl && (
            <Button
              size="xs"
              variant="solid"
              colorPalette="blue"
              asChild
              flexShrink={0}
            >
              <a
                href={plugin.pluginStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LuExternalLink size={14} />
                {t("pluginDetail.viewInStore")}
              </a>
            </Button>
          )}
        </HStack>
      </Box>

      {/* Main Content */}
      <Box
        flex="1"
        overflow="auto"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
      >
        <Tabs.Root
          value={activeTab}
          onValueChange={(details) =>
            setActiveTab(
              details.value as "overview" | "functions" | "permissions",
            )}
        >
          <Tabs.List borderBottomWidth="1px" mb={4}>
            <Tabs.Trigger value="overview" px={4} py={2}>
              <Text fontSize="sm">{t("pluginDetail.tabs.overview")}</Text>
            </Tabs.Trigger>
            <Tabs.Trigger value="functions" px={4} py={2}>
              <Text fontSize="sm">{t("pluginDetail.tabs.functions")}</Text>
            </Tabs.Trigger>
            <Tabs.Trigger value="permissions" px={4} py={2}>
              <Text fontSize="sm">
                {t("pluginDetail.tabs.permissions")}
              </Text>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview">
            <VStack align="stretch" gap={4} maxW="800px">
              {/* Description */}
              {!isExternal && plugin.description && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {t("pluginDetail.overview.description")}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {plugin.description}
                  </Text>
                </Box>
              )}

              {/* Metadata */}
              <VStack align="stretch" gap={3}>
                <MetadataRow
                  label={t("pluginDetail.overview.packageId")}
                  value={
                    <Text
                      fontSize="sm"
                      fontFamily="mono"
                      bg="bg.subtle"
                      px={2}
                      py={1}
                      rounded="md"
                      wordBreak="break-all"
                      maxW="full"
                    >
                      {plugin.packageId}
                    </Text>
                  }
                />
                <MetadataRow
                  label={t("pluginDetail.overview.version")}
                  value={<Text fontSize="sm">v{plugin.packageVersion}</Text>}
                />
                <MetadataRow
                  label={t("pluginDetail.overview.provider")}
                  value={<Text fontSize="sm">{plugin.providerId}</Text>}
                />
                <MetadataRow
                  label={t("pluginDetail.overview.installedAt")}
                  value={
                    <Text fontSize="sm">
                      {formatDate(plugin.installedAt)}
                    </Text>
                  }
                />
                <MetadataRow
                  label={t("pluginDetail.overview.updatedAt")}
                  value={
                    <Text fontSize="sm">{formatDate(plugin.updatedAt)}</Text>
                  }
                />
              </VStack>
            </VStack>
          </Tabs.Content>

          {/* Functions Tab */}
          <Tabs.Content value="functions">
            <VStack align="stretch" gap={3} maxW="900px">
              {isExternal
                ? (
                  <Box
                    borderWidth="1px"
                    rounded="lg"
                    p={8}
                    textAlign="center"
                    bg="bg"
                  >
                    <VStack gap={3}>
                      <Text color="fg.muted" fontSize="sm">
                        外部プラグインの関数情報は表示できません
                      </Text>
                      <Text fontSize="xs" color="fg.subtle">
                        プラグインをインストールして使用すると、関数情報が表示されます
                      </Text>
                    </VStack>
                  </Box>
                )
                : plugin.functions.length === 0
                ? (
                  <Box
                    borderWidth="1px"
                    rounded="lg"
                    p={8}
                    textAlign="center"
                    bg="bg"
                  >
                    <Text color="fg.muted">
                      {t("pluginDetail.functions.noFunctions")}
                    </Text>
                  </Box>
                )
                : (
                  plugin.functions.map((fn) => (
                    <FunctionCard key={fn.functionId} fn={fn} />
                  ))
                )}
            </VStack>
          </Tabs.Content>

          {/* Permissions Tab */}
          <Tabs.Content value="permissions">
            <VStack align="stretch" gap={3} maxW="800px">
              {isExternal
                ? (
                  <Box
                    borderWidth="1px"
                    rounded="lg"
                    p={8}
                    textAlign="center"
                    bg="bg"
                  >
                    <VStack gap={3}>
                      <Text color="fg.muted" fontSize="sm">
                        外部プラグインの権限情報は表示できません
                      </Text>
                      <Text fontSize="xs" color="fg.subtle">
                        プラグインをインストールして使用すると、権限情報が表示されます
                      </Text>
                    </VStack>
                  </Box>
                )
                : plugin.functions.length === 0 ||
                    plugin.functions.every(
                      (fn) => !fn.permissions || fn.permissions.length === 0,
                    )
                ? (
                  <Box
                    borderWidth="1px"
                    rounded="lg"
                    p={8}
                    textAlign="center"
                    bg="bg"
                  >
                    <Text color="fg.muted">
                      {t("pluginDetail.permissions.noPermissions")}
                    </Text>
                  </Box>
                )
                : (
                  plugin.functions.map((fn) =>
                    fn.permissions && fn.permissions.length > 0
                      ? (
                        <Box
                          key={fn.functionId}
                          borderWidth="1px"
                          rounded="lg"
                          p={4}
                          bg="bg"
                        >
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            {fn.functionName}
                          </Text>
                          <Text fontSize="xs" color="fg.muted" mb={3}>
                            {fn.description ||
                              t("pluginDetail.functions.noDescription")}
                          </Text>
                          <HStack gap={1} flexWrap="wrap">
                            {fn.permissions.map((perm, idx) => (
                              <Badge key={idx} variant="subtle" size="sm">
                                {perm.displayName || perm.permissionType ||
                                  String(perm)}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                      )
                      : null
                  )
                )}
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Flex>
  );
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      borderBottomWidth="1px"
      py={2}
      gap={2}
    >
      <Text
        fontSize="sm"
        color="fg.muted"
        minW={{ base: "auto", sm: "150px" }}
        flexShrink={0}
      >
        {label}
      </Text>
      <Box minW={0} flex={1}>
        {value}
      </Box>
    </Flex>
  );
}

function FunctionCard({
  fn,
}: {
  fn: PluginFunction;
}) {
  return (
    <Card.Root borderRadius="xl">
      <Card.Body p={4}>
        <VStack align="stretch" gap={3}>
          {/* Header */}
          <HStack justify="space-between" align="start">
            <VStack align="start" gap={1} flex={1}>
              <Text fontWeight="semibold" fontSize="sm">{fn.functionName}</Text>
              {fn.description && (
                <Text fontSize="xs" color="fg.muted">
                  {fn.description}
                </Text>
              )}
            </VStack>
            <Badge variant="outline" fontSize="xs">
              v{fn.version}
            </Badge>
          </HStack>

          {/* Function ID */}
          <Text
            fontSize="xs"
            fontFamily="mono"
            color="fg.muted"
            bg="bg.subtle"
            px={2}
            py={1}
            rounded="md"
          >
            {fn.functionId}
          </Text>

          {/* Permissions */}
          {fn.permissions && fn.permissions.length > 0 && (
            <HStack gap={1} flexWrap="wrap">
              {fn.permissions.map((perm, idx) => (
                <Badge key={idx} variant="subtle" size="sm">
                  {perm.displayName || perm.permissionType || String(perm)}
                </Badge>
              ))}
            </HStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export default PluginDetailPage;
