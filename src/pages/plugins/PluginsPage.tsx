import React from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  Separator,
  Spinner,
  Text,
  VStack,
  useDisclosure,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { Toaster } from "@/components/ui/toaster";
import { toaster } from "@/components/ui/toaster-instance";
import {
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

export function PluginsPage() {
  const { t } = useI18n();
  const [plugins, setPlugins] = React.useState<PluginPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [uninstalling, setUninstalling] = React.useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = React.useState<PluginPackage | null>(null);
  const { open: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

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

  // 統計情報
  const stats = React.useMemo(() => {
    const verified = plugins.filter((p) => p.verified).length;
    const internal = plugins.filter((p) => p.internalPlugin).length;
    const deprecated = plugins.filter((p) => p.deprecated).length;
    return { total: plugins.length, verified, internal, deprecated };
  }, [plugins]);

  return (
    <VStack align="stretch" gap={4} h="full" p={{ base: 2, md: 4 }}>
      {/* ヘッダー */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <VStack align="start" gap={0}>
          <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
            {t("pluginsPage.title")}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {t("pluginsPage.description")}
          </Text>
        </VStack>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchPlugins}
          disabled={loading}
        >
          <LuRefreshCw />
          {t("pluginsPage.refresh")}
        </Button>
      </HStack>

      {/* 統計カード */}
      <HStack gap={3} flexWrap="wrap">
        <StatCard
          label={t("pluginsPage.stats.total")}
          value={stats.total}
          colorPalette="gray"
        />
        <StatCard
          label={t("pluginsPage.stats.verified")}
          value={stats.verified}
          colorPalette="blue"
        />
        <StatCard
          label={t("pluginsPage.stats.internal")}
          value={stats.internal}
          colorPalette="purple"
        />
        <StatCard
          label={t("pluginsPage.stats.deprecated")}
          value={stats.deprecated}
          colorPalette="orange"
        />
      </HStack>

      {/* 検索 */}
      <InputGroup maxW={{ base: "full", md: "320px" }}>
        <Input
          placeholder={t("plugins.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      <Separator />

      {/* プラグインリスト */}
      <Box flex={1} minH={0} overflowY="auto">
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
      </Box>

      {/* 確認ダイアログ */}
      <Dialog.Root open={isConfirmOpen} onOpenChange={(details) => !details.open && onConfirmClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t("pluginsPage.uninstallConfirmTitle")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  {t("pluginsPage.uninstallConfirmMessage", { name: selectedPlugin?.packageName })}
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={confirmUninstall} loading={!!uninstalling}>
                  {t("pluginsPage.uninstall")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" right={2} top={2}>
                  ✕
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Toaster />
    </VStack>
  );
}

function StatCard({
  label,
  value,
  colorPalette,
}: {
  label: string;
  value: number;
  colorPalette: string;
}) {
  return (
    <Box
      borderWidth="1px"
      rounded="lg"
      px={4}
      py={3}
      minW="120px"
      bg="bg"
    >
      <Text fontSize="2xl" fontWeight="bold" color={`${colorPalette}.500`}>
        {value}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
    </Box>
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
      p={4}
      bg="bg"
      opacity={isDeprecated ? 0.7 : 1}
      _hover={{ borderColor: "border.emphasized", cursor: "pointer" }}
      transition="border-color 0.2s"
      onClick={handleClick}
    >
      <HStack justify="space-between" align="start" gap={4}>
        <VStack align="start" gap={2} flex={1}>
          {/* ヘッダー */}
          <HStack gap={2} flexWrap="wrap">
            <Text fontWeight="semibold" fontSize="md">
              {plugin.packageName}
            </Text>
            <Badge variant="outline" fontSize="xs">
              v{plugin.packageVersion}
            </Badge>
            {isVerified && (
              <Badge colorPalette="blue" fontSize="xs">
                <LuShield size={12} />
                {t("plugins.verified")}
              </Badge>
            )}
            {isInternal && (
              <Badge colorPalette="purple" fontSize="xs">
                {t("plugins.internal")}
              </Badge>
            )}
            {isDeprecated && (
              <Badge colorPalette="orange" fontSize="xs">
                {t("plugins.deprecated")}
              </Badge>
            )}
          </HStack>

          {/* 説明 */}
          {plugin.description && (
            <Text fontSize="sm" color="fg.muted">
              {plugin.description}
            </Text>
          )}

          {/* パッケージID */}
          <Text fontSize="xs" color="fg.subtle" fontFamily="mono">
            {plugin.packageId}
          </Text>

          {/* 関数一覧 */}
          {plugin.functions.length > 0 && (
            <HStack gap={1} flexWrap="wrap">
              <Text fontSize="xs" color="fg.muted">
                {t("pluginsPage.functions")}:
              </Text>
              {plugin.functions.slice(0, 3).map((fn) => (
                <Badge key={fn.functionId} variant="subtle" size="sm">
                  {fn.functionName}
                </Badge>
              ))}
              {plugin.functions.length > 3 && (
                <Badge variant="subtle" size="sm">
                  +{plugin.functions.length - 3}
                </Badge>
              )}
            </HStack>
          )}
        </VStack>

        {/* アクション */}
        <VStack gap={2}>
          {plugin.pluginStoreUrl && (
            <Button
              size="xs"
              variant="ghost"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={plugin.pluginStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LuExternalLink size={14} />
                {t("pluginsPage.viewDetails")}
              </a>
            </Button>
          )}
          {canUninstall && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={handleUninstallClick}
              loading={isUninstalling}
            >
              <LuTrash2 size={14} />
              {t("pluginsPage.uninstall")}
            </Button>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

export default PluginsPage;
