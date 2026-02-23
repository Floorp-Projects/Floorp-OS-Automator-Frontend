import React from "react";
import {
  Badge,
  HStack,
  Input,
  InputGroup,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { EmptyState } from "@/components/ui/empty-state";
import { LuCircleAlert, LuPackage } from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";
import { clients } from "@/lib/grpc-clients";
import type { PluginPackage } from "@/gen/sapphillon/v1/plugin_pb";

export function PluginsPanel() {
  const { t } = useI18n();
  const [plugins, setPlugins] = React.useState<PluginPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    async function fetchPlugins() {
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
    }
    fetchPlugins();
  }, [t]);

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
    <VStack
      align="stretch"
      gap={2}
      p={{ base: 2, md: 3 }}
      bg="bg"
      h="full"
      minH={0}
      display="grid"
      gridTemplateRows="auto 1px minmax(0, 1fr)"
      overflow="hidden"
    >
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
          {t("common.plugins")}
        </Text>
        <HStack gap={2}>
          <InputGroup maxW={{ base: "32", sm: "40" }}>
            <Input
              placeholder={t("plugins.searchPlaceholder")}
              fontSize={{ base: "xs", sm: "sm" }}
              minH={{ base: "36px", md: "auto" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </HStack>
      </HStack>
      <Separator />
      <VStack align="stretch" gap={2} minH={0} overflowY="auto">
        {loading
          ? (
            <HStack justify="center" py={4}>
              <Spinner size="sm" />
              <Text fontSize="sm" color="fg.muted">
                {t("common.loading")}
              </Text>
            </HStack>
          )
          : error
          ? (
            <EmptyState
              icon={<LuCircleAlert />}
              title={t("plugins.fetchErrorTitle")}
              description={error}
            />
          )
          : filteredPlugins.length === 0
          ? (
            <EmptyState
              icon={<LuPackage />}
              title={t("plugins.emptyTitle")}
              description={t("plugins.emptyDescription")}
            />
          )
          : (
            filteredPlugins.map((plugin) => (
              <PluginItem key={plugin.packageId} plugin={plugin} t={t} />
            ))
          )}
      </VStack>
    </VStack>
  );
}

function PluginItem({
  plugin,
  t,
}: {
  plugin: PluginPackage;
  t: (key: string) => string;
}) {
  const isDeprecated = plugin.deprecated;
  const isVerified = plugin.verified;
  const isInternal = plugin.internalPlugin;

  return (
    <HStack
      justify="space-between"
      borderWidth="1px"
      rounded="md"
      p={{ base: 1.5, md: 2 }}
      opacity={isDeprecated ? 0.6 : 1}
    >
      <VStack align="start" gap={0} flex={1} minW={0}>
        <HStack gap={1} flexWrap="wrap">
          <Text
            fontWeight="medium"
            fontSize={{ base: "sm", md: "md" }}
            truncate
          >
            {plugin.packageName}
          </Text>
          {isVerified && (
            <Badge colorPalette="blue" fontSize="2xs" px={1}>
              {t("plugins.verified")}
            </Badge>
          )}
          {isInternal && (
            <Badge colorPalette="purple" fontSize="2xs" px={1}>
              {t("plugins.internal")}
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          v{plugin.packageVersion}
        </Text>
        {plugin.description && (
          <Text
            fontSize="xs"
            color="fg.subtle"
            truncate
            w="full"
            minW={0}
          >
            {plugin.description}
          </Text>
        )}
      </VStack>
      <HStack gap={2} flexShrink={0}>
        {isDeprecated
          ? (
            <Badge colorPalette="orange" fontSize="xs" px={{ base: 1, md: 2 }}>
              {t("plugins.deprecated")}
            </Badge>
          )
          : (
            <Badge colorPalette="green" fontSize="xs" px={{ base: 1, md: 2 }}>
              {t("plugins.enabled")}
            </Badge>
          )}
      </HStack>
    </HStack>
  );
}
