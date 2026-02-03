import React from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Portal,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { Toaster } from "@/components/ui/toaster";
import { toaster } from "@/components/ui/toaster-instance";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuExternalLink,
  LuPackage,
  LuRefreshCw,
  LuShield,
  LuTrash2,
} from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";
import { clients } from "@/lib/grpc-clients";
import type { PluginPackage } from "@/gen/sapphillon/v1/plugin_pb";

// プラグインストアのURL（環境に応じて切り替え）
const PLUGIN_STORE_URL = import.meta.env.DEV
  ? "http://localhost:5178/"
  : "https://plugins.floorp.app";

export function PluginsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [plugins, setPlugins] = React.useState<PluginPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [uninstalling, setUninstalling] = React.useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = React.useState<
    PluginPackage | null
  >(null);
  const {
    open: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose,
  } = useDisclosure();

  const fetchPlugins = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clients.plugin.listPlugins({ pageSize: 100 });
      setPlugins(response.plugins);
    } catch (e) {
      console.error("Failed to fetch plugins:", e);
      setError(t("plugins.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleUninstall = React.useCallback(async (plugin: PluginPackage) => {
    setSelectedPlugin(plugin);
    onConfirmOpen();
  }, [onConfirmOpen]);

  const confirmUninstall = React.useCallback(async () => {
    if (!selectedPlugin) return;

    const packageId = selectedPlugin.packageId;
    setUninstalling(packageId);
    onConfirmClose();

    try {
      const response = await clients.plugin.uninstallPlugin({ packageId });

      if (response.status?.code === 0) {
        toaster.success({
          title: t("pluginsPage.uninstallSuccess"),
          description: selectedPlugin.packageName,
        });
        // Refresh plugin list
        await fetchPlugins();
      } else {
        toaster.error({
          title: t("pluginsPage.uninstallError"),
          description: response.status?.message || t("common.unknownError"),
        });
      }
    } catch (e) {
      console.error("Failed to uninstall plugin:", e);
      toaster.error({
        title: t("pluginsPage.uninstallError"),
        description: e instanceof Error ? e.message : t("common.unknownError"),
      });
    } finally {
      setUninstalling(null);
      setSelectedPlugin(null);
    }
  }, [selectedPlugin, onConfirmClose, fetchPlugins, t]);

  // 検索フィルター
  const filteredPlugins = React.useMemo(() => {
    if (!searchQuery.trim()) return plugins;
    const query = searchQuery.toLowerCase();
    return plugins.filter(
      (p) =>
        p.packageName.toLowerCase().includes(query) ||
        p.packageId.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [plugins, searchQuery]);

  return (
    <Flex direction="column" h="full" overflow="hidden" fontSize="md">
      {/* Header - WorkflowsPageスタイルに統一 */}
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
            <Heading size="sm">{t("pluginsPage.title")}</Heading>
          </HStack>
          <HStack gap={1}>
            <IconButton
              aria-label={t("pluginsPage.refresh")}
              variant="ghost"
              size="xs"
              onClick={fetchPlugins}
              disabled={loading}
            >
              <LuRefreshCw />
            </IconButton>
            <Button
              colorPalette="floorp"
              size="xs"
              asChild
            >
              <a
                href={PLUGIN_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LuPackage />
                <Text>{t("pluginsPage.openStore")}</Text>
              </a>
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Content */}
      <Box
        flex="1"
        overflowY="auto"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
      >
        <VStack align="stretch" gap={4}>
          {/* 検索 */}
          <Input
            placeholder={t("plugins.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxW={{ base: "full", md: "320px" }}
            borderRadius="lg"
          />

          {/* プラグインリスト */}
          {loading
            ? (
              <HStack justify="center" py={8}>
                <Spinner size="md" />
                <Text color="fg.muted">{t("common.loading")}</Text>
              </HStack>
            )
            : error
            ? (
              <EmptyState
                icon={<LuCircleAlert size={40} />}
                title={t("plugins.fetchErrorTitle")}
                description={error}
              />
            )
            : filteredPlugins.length === 0
            ? (
              <EmptyState
                icon={<LuPackage size={40} />}
                title={t("plugins.emptyTitle")}
                description={searchQuery
                  ? t("pluginsPage.noSearchResults")
                  : t("plugins.emptyDescription")}
              />
            )
            : (
              <VStack align="stretch" gap={3}>
                {filteredPlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.packageId}
                    plugin={plugin}
                    t={t}
                    onUninstall={handleUninstall}
                    isUninstalling={uninstalling === plugin.packageId}
                  />
                ))}
              </VStack>
            )}
        </VStack>
      </Box>

      {/* 確認ダイアログ */}
      <Dialog.Root
        open={isConfirmOpen}
        onOpenChange={(details) => !details.open && onConfirmClose()}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {t("pluginsPage.uninstallConfirmTitle")}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {t("pluginsPage.uninstallConfirmMessage", {
                    name: selectedPlugin?.packageName,
                  })}
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  onClick={confirmUninstall}
                  loading={!!uninstalling}
                >
                  {t("pluginsPage.uninstall")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  position="absolute"
                  right={2}
                  top={2}
                >
                  ✕
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Toaster />
    </Flex>
  );
}

function PluginCard({
  plugin,
  t,
  onUninstall,
  isUninstalling,
}: {
  plugin: PluginPackage;
  t: (key: string) => string;
  onUninstall?: (plugin: PluginPackage) => void;
  isUninstalling?: boolean;
}) {
  const navigate = useNavigate();
  const isDeprecated = plugin.deprecated;
  const isVerified = plugin.verified;
  const isInternal = plugin.internalPlugin;
  // 外部プラグイン（internalPlugin === false）のみアンインストール可能
  const canUninstall = !isInternal && onUninstall;

  const handleClick = React.useCallback(() => {
    navigate(`/plugins/${plugin.packageId}`, { state: { plugin } });
  }, [navigate, plugin]);

  const handleUninstallClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (canUninstall) {
      onUninstall(plugin);
    }
  }, [canUninstall, onUninstall, plugin]);

  return (
    <Box
      borderWidth="1px"
      rounded="lg"
      p={{ base: 3, md: 4 }}
      bg="bg"
      opacity={isDeprecated ? 0.7 : 1}
      _hover={{ borderColor: "border.emphasized", cursor: "pointer" }}
      transition="border-color 0.2s"
      onClick={handleClick}
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "flex-start" }}
        gap={3}
      >
        <VStack align="start" gap={2} flex={1} minW={0}>
          {/* ヘッダー */}
          <HStack gap={2} flexWrap="wrap" minW={0} w="full">
            <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
              {plugin.packageName}
            </Text>
            <Badge variant="outline" fontSize="xs" flexShrink={0}>
              v{plugin.packageVersion}
            </Badge>
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

          {/* 説明 */}
          {plugin.description && (
            <Text fontSize="sm" color="fg.muted" lineClamp={2}>
              {plugin.description}
            </Text>
          )}

          {/* パッケージID */}
          <Text
            fontSize="xs"
            color="fg.subtle"
            fontFamily="mono"
            lineClamp={1}
            wordBreak="break-all"
            w="full"
          >
            {plugin.packageId}
          </Text>

          {/* 関数一覧 */}
          {plugin.functions.length > 0 && (
            <HStack gap={1} flexWrap="wrap" minW={0} w="full">
              <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                {t("pluginsPage.functions")}:
              </Text>
              {plugin.functions.slice(0, 3).map((fn) => (
                <Badge
                  key={fn.functionId}
                  variant="subtle"
                  size="sm"
                  flexShrink={0}
                >
                  {fn.functionName}
                </Badge>
              ))}
              {plugin.functions.length > 3 && (
                <Badge variant="subtle" size="sm" flexShrink={0}>
                  +{plugin.functions.length - 3}
                </Badge>
              )}
            </HStack>
          )}
        </VStack>

        {/* アクション */}
        {(plugin.pluginStoreUrl || canUninstall) && (
          <VStack gap={2} flexShrink={0} w={{ base: "full", sm: "auto" }}>
            {plugin.pluginStoreUrl && (
              <Button
                size="xs"
                variant="solid"
                colorPalette="blue"
                asChild
                onClick={(e) => e.stopPropagation()}
                w={{ base: "full", sm: "auto" }}
              >
                <a
                  href={plugin.pluginStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LuExternalLink size={14} />
                  {t("pluginsPage.viewInStore")}
                </a>
              </Button>
            )}
            {canUninstall && (
              <Button
                size="xs"
                variant="solid"
                colorPalette="red"
                onClick={handleUninstallClick}
                loading={isUninstalling}
                w={{ base: "full", sm: "auto" }}
              >
                <LuTrash2 size={14} />
                {t("pluginsPage.uninstall")}
              </Button>
            )}
          </VStack>
        )}
      </Flex>
    </Box>
  );
}

export default PluginsPage;
