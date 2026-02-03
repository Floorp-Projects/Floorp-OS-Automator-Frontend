/**
 * @fileoverview プラグインインストールページ（リファクタリング版）
 *
 * 他のページと同様のスタイルを使用
 * 結果表示は別のModalに分離
 *
 * @module pages/install-plugin/InstallPluginPage
 */

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster-instance";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clients } from "@/lib/grpc-clients";
import {
  LuArrowLeft,
  LuCheck,
  LuCode,
  LuExternalLink,
  LuPackage,
  LuShieldAlert,
  LuUser,
} from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";
import { InstallResultModal } from "./InstallResultModal";

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
  icon?: string;
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
  if (!functionsJson) return undefined;
  try {
    const decoded = decodeURIComponent(functionsJson);
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(functionsJson);
    } catch {
      return undefined;
    }
  }
}

export function InstallPluginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pluginInfo, setPluginInfo] = useState<PluginInfo | null>(null);
  const [status, setStatus] = useState<InstallStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    const uri = searchParams.get("uri");
    if (!uri) {
      setStatus("error");
      setErrorMessage(t("installPlugin.unknownError"));
      setShowResultModal(true);
      return;
    }

    setPluginInfo({
      uri,
      id: searchParams.get("id") || undefined,
      name: searchParams.get("name") || undefined,
      author: searchParams.get("author") || undefined,
      version: searchParams.get("version") || undefined,
      description: searchParams.get("description") || undefined,
      category: searchParams.get("category") || "utilities",
      isOfficial: searchParams.get("isOfficial") === "true",
      icon: searchParams.get("icon") || undefined,
      functions: parseFunctionsFromParams(searchParams),
    });
  }, [searchParams, t]);

  const handleInstall = async () => {
    if (!pluginInfo) return;

    setStatus("installing");
    try {
      const response = await clients.plugin.installPlugin({
        uri: pluginInfo.uri,
      });

      if (response.status && response.status.code !== 0) {
        throw new Error(response.status.message || "Installation failed");
      }

      setStatus("success");
      setShowResultModal(true);
      toaster.create({
        title: t("installPlugin.successTitle"),
        description: pluginInfo.name || pluginInfo.uri,
        type: "success",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      if (errorMsg.includes("already installed")) {
        setStatus("success");
        setShowResultModal(true);
        toaster.create({
          title: t("installPlugin.successTitle"),
          description: pluginInfo.name || pluginInfo.uri,
          type: "success",
        });
      } else {
        setStatus("error");
        setErrorMessage(errorMsg);
        setShowResultModal(true);
        toaster.create({
          title: t("installPlugin.errorTitle"),
          description: errorMsg,
          type: "error",
        });
      }
    }
  };

  const handleCancel = () => {
    navigate("/plugins");
  };

  const handleResultClose = () => {
    setShowResultModal(false);
    if (status === "success") {
      navigate("/plugins");
    }
  };

  const handleRetry = () => {
    setShowResultModal(false);
    setStatus("confirm");
  };

  const handleOpenDetails = () => {
    const detailsUrl = pluginInfo?.uri ||
      `https://floorp.app/plugins/${pluginInfo?.id || "unknown"}`;
    window.open(detailsUrl, "_blank");
  };

  const getCategoryLabel = (category?: string) => {
    const key = `installPlugin.category.${category || "utilities"}`;
    return t(key);
  };

  return (
    <>
      <Dialog.Root open={status === "confirm" || status === "installing"} onOpenChange={(details) => !details.open && handleCancel()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="xl" maxW="550px">
              <Dialog.Header borderBottomWidth="1px" px={4} py={3}>
                <HStack justify="space-between" w="full">
                  <HStack gap={2}>
                    <IconButton
                      aria-label={t("common.back")}
                      variant="ghost"
                      size="xs"
                      onClick={handleCancel}
                    >
                      <LuArrowLeft />
                    </IconButton>
                    <Heading size="sm">{t("installPlugin.title")}</Heading>
                  </HStack>
                </HStack>
              </Dialog.Header>

              <Dialog.Body py={4} px={4}>
                {status === "installing" ? (
                  <VStack gap={4} py={8}>
                    <Spinner size="lg" color="floorp.500" />
                    <Text color="fg.muted">{t("installPlugin.installing")}</Text>
                  </VStack>
                ) : (
                  <VStack align="stretch" gap={4}>
                    {/* Plugin Info */}
                    <HStack align="start" gap={4}>
                      {/* Icon */}
                      <Flex
                        w="56px"
                        h="56px"
                        minW="56px"
                        borderRadius="lg"
                        bg="bg.muted"
                        align="center"
                        justify="center"
                        overflow="hidden"
                      >
                        {pluginInfo?.icon ? (
                          <Box
                            as="img"
                            src={pluginInfo.icon}
                            alt={pluginInfo.name || "Plugin"}
                            w="36px"
                            h="36px"
                            objectFit="contain"
                          />
                        ) : (
                          <Icon as={LuPackage} boxSize={8} color="floorp.500" />
                        )}
                      </Flex>

                      {/* Details */}
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="semibold" fontSize="md">
                          {pluginInfo?.name || t("common.unknown")}
                        </Text>
                        <HStack gap={2} flexWrap="wrap" fontSize="sm" color="fg.muted">
                          {pluginInfo?.author && (
                            <HStack gap={1}>
                              <Icon as={LuUser} boxSize={3.5} />
                              <Text>{pluginInfo.author}</Text>
                            </HStack>
                          )}
                          {pluginInfo?.version && (
                            <Badge variant="outline" fontSize="xs">
                              v{pluginInfo.version}
                            </Badge>
                          )}
                          {pluginInfo?.isOfficial && (
                            <Badge colorPalette="floorp" fontSize="xs">
                              <HStack gap={1}>
                                <Icon as={LuCheck} boxSize={3} />
                                <span>{t("installPlugin.official")}</span>
                              </HStack>
                            </Badge>
                          )}
                          <Badge variant="outline" fontSize="xs">
                            {getCategoryLabel(pluginInfo?.category)}
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Description */}
                    {pluginInfo?.description && (
                      <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                        {pluginInfo.description}
                      </Text>
                    )}

                    {/* Functions */}
                    {pluginInfo?.functions && pluginInfo.functions.length > 0 && (
                      <VStack align="stretch" gap={2}>
                        <HStack gap={2} fontSize="sm" fontWeight="medium" color="fg">
                          <Icon as={LuCode} boxSize={4} />
                          <Text>
                            {t("installPlugin.functions")} ({pluginInfo.functions.length})
                          </Text>
                        </HStack>
                        <Box
                          borderWidth="1px"
                          borderColor="border"
                          borderRadius="lg"
                          maxH="180px"
                          overflowY="auto"
                        >
                          <VStack align="stretch" gap={0} divideY="1px" divideColor="border">
                            {pluginInfo.functions.map((func, index) => (
                              <Box key={index} p={3}>
                                <VStack align="start" gap={0.5}>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    fontFamily="mono"
                                  >
                                    {func.name}
                                  </Text>
                                  {func.description && (
                                    <Text fontSize="xs" color="fg.muted">
                                      {func.description}
                                    </Text>
                                  )}
                                  {func.parameters && func.parameters.length > 0 && (
                                    <HStack gap={1} mt={1} flexWrap="wrap">
                                      {func.parameters.map((param, pidx) => (
                                        <Badge
                                          key={pidx}
                                          variant="subtle"
                                          size="sm"
                                          fontFamily="mono"
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

                    {/* Warning */}
                    <HStack
                      align="start"
                      gap={3}
                      p={3}
                      bg="orange.500/10"
                      borderWidth="1px"
                      borderColor="orange.500/30"
                      borderRadius="lg"
                    >
                      <Icon
                        as={LuShieldAlert}
                        boxSize={4}
                        color="orange.500"
                        flexShrink={0}
                        mt={0.5}
                      />
                      <Text fontSize="sm" color="fg">
                        {t("installPlugin.warning")}
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </Dialog.Body>

              {status === "confirm" && (
                <Dialog.Footer borderTopWidth="1px" px={4} py={3}>
                  <HStack justify="space-between" w="full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenDetails}
                    >
                      <LuExternalLink size={14} />
                      {t("installPlugin.details")}
                    </Button>
                    <HStack gap={2}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        colorPalette="floorp"
                        size="sm"
                        onClick={handleInstall}
                      >
                        {t("installPlugin.install")}
                      </Button>
                    </HStack>
                  </HStack>
                </Dialog.Footer>
              )}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Result Modal */}
      <InstallResultModal
        open={showResultModal}
        status={status === "success" ? "success" : "error"}
        pluginName={pluginInfo?.name}
        errorMessage={errorMessage}
        onClose={handleResultClose}
        onRetry={status === "error" ? handleRetry : undefined}
      />
    </>
  );
}

export default InstallPluginPage;
