/**
 * @fileoverview インストール結果モーダル
 *
 * プラグインインストールの結果（成功/エラー）を表示する
 * 確認ダイアログとは別のモーダルとして分離
 *
 * @module pages/install-plugin/InstallResultModal
 */

import {
  Button,
  Dialog,
  Flex,
  HStack,
  Icon,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuCheck, LuX } from "react-icons/lu";
import { useI18n } from "@/hooks/useI18n";

interface InstallResultModalProps {
  open: boolean;
  status: "success" | "error";
  pluginName?: string;
  errorMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function InstallResultModal({
  open,
  status,
  pluginName,
  errorMessage,
  onClose,
  onRetry,
}: InstallResultModalProps) {
  const { t } = useI18n();

  const isSuccess = status === "success";

  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="xl" maxW="400px">
            <Dialog.Body py={8}>
              <VStack gap={4}>
                {/* Icon */}
                <Flex
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  bg={isSuccess ? "green.500/15" : "red.500/15"}
                  align="center"
                  justify="center"
                >
                  <Icon
                    as={isSuccess ? LuCheck : LuX}
                    boxSize={8}
                    color={isSuccess ? "green.500" : "red.500"}
                  />
                </Flex>

                {/* Message */}
                <VStack gap={1}>
                  <Text fontSize="lg" fontWeight="semibold" color="fg">
                    {isSuccess
                      ? t("installPlugin.successTitle")
                      : t("installPlugin.errorTitle")}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" textAlign="center">
                    {isSuccess
                      ? t("installPlugin.successDescription", { name: pluginName })
                      : errorMessage || t("installPlugin.unknownError")}
                  </Text>
                </VStack>

                {/* Actions */}
                <HStack gap={2} pt={2}>
                  {isSuccess ? (
                    <Button
                      colorPalette="floorp"
                      borderRadius="lg"
                      onClick={onClose}
                    >
                      {t("installPlugin.goToPlugins")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        borderRadius="lg"
                        onClick={onClose}
                      >
                        {t("common.cancel")}
                      </Button>
                      {onRetry && (
                        <Button
                          colorPalette="floorp"
                          borderRadius="lg"
                          onClick={onRetry}
                        >
                          {t("installPlugin.retry")}
                        </Button>
                      )}
                    </>
                  )}
                </HStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
