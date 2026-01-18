import React from "react";
import {
  Button,
  Dialog,
  Field,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuCopy, LuX } from "react-icons/lu";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import { useWorkflowClone } from "@/hooks/useWorkflowClone";
import { useI18n } from "@/hooks/useI18n";

interface WorkflowCloneDialogProps {
  open: boolean;
  onClose: () => void;
  workflow: Workflow;
  onSuccess?: (clonedWorkflow: Workflow) => void;
}

export function WorkflowCloneDialog({
  open,
  onClose,
  workflow,
  onSuccess,
}: WorkflowCloneDialogProps) {
  const { t } = useI18n();
  const { cloneWorkflow, cloning, error } = useWorkflowClone();
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  // ダイアログが開かれた時にデフォルト値を設定
  React.useEffect(() => {
    if (open) {
      setNewName(`${workflow.displayName || t("common.untitledWorkflow")} (${t("common.copy")})`);
      setNewDescription(
        workflow.description
          ? `${workflow.description} (${t("clone.clone")})`
          : t("clone.clone")
      );
    }
  }, [open, workflow, t]);

  const handleClone = React.useCallback(async () => {
    const cloned = await cloneWorkflow(workflow, {
      newName: newName.trim() || `${workflow.displayName} (${t("common.copy")})`,
    });

    if (cloned) {
      // 説明文を上書き
      cloned.description = newDescription.trim();
      onSuccess?.(cloned);
      onClose();
    }
  }, [cloneWorkflow, workflow, newName, newDescription, onSuccess, onClose, t]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // IME変換中は無視
      if (e.nativeEvent.isComposing) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !cloning) {
        e.preventDefault();
        handleClone();
      }
    },
    [handleClone, cloning]
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "lg" }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW={{ base: "100vw", md: "600px" }}>
          <Dialog.Header>
            <HStack justify="space-between" w="full">
              <HStack gap={2}>
                <LuCopy />
                <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>
                  {t("clone.title")}
                </Text>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <IconButton
                  aria-label={t("clone.close")}
                  variant="ghost"
                  size="sm"
                  disabled={cloning}
                >
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack align="stretch" gap={4} onKeyDown={handleKeyDown}>
              {/* 元のワークフロー情報 */}
              <VStack align="stretch" gap={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {t("clone.source")}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {workflow.displayName || t("common.untitledWorkflow")}
                </Text>
              </VStack>

              {/* 新しい名前 */}
              <Field.Root>
                <Field.Label>{t("clone.newName")}</Field.Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("clone.newNamePlaceholder")}
                  autoFocus
                  disabled={cloning}
                />
                <Field.HelperText>
                  {t("clone.newNameHelper")}
                </Field.HelperText>
              </Field.Root>

              {/* 新しい説明 */}
              <Field.Root>
                <Field.Label>{t("clone.description")}</Field.Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t("clone.descriptionPlaceholder")}
                  rows={3}
                  disabled={cloning}
                />
                <Field.HelperText>
                  {t("clone.descriptionHelper")}
                </Field.HelperText>
              </Field.Root>

              {/* エラー表示 */}
              {error && (
                <VStack
                  align="stretch"
                  gap={1}
                  p={3}
                  bg="red.50"
                  borderWidth="1px"
                  borderColor="red.200"
                  rounded="md"
                  css={{
                    _dark: {
                      bg: "red.900/20",
                      borderColor: "red.800",
                    },
                  }}
                >
                  <Text fontSize="sm" fontWeight="medium" color="red.700">
                    {t("clone.error")}
                  </Text>
                  <Text fontSize="xs" color="red.600">
                    {error.message}
                  </Text>
                </VStack>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <HStack gap={2} w="full">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={cloning}
                flex="1"
              >
                {t("clone.cancel")}
              </Button>
              <Button
                colorPalette="floorp"
                onClick={handleClone}
                disabled={cloning || !newName.trim()}
                flex="1"
              >
                {cloning ? (
                  <HStack gap={2}>
                    <Spinner size="xs" />
                    <Text>{t("clone.cloning")}</Text>
                  </HStack>
                ) : (
                  <>
                    <LuCopy />
                    <Text>{t("clone.clone")}</Text>
                  </>
                )}
              </Button>
            </HStack>
          </Dialog.Footer>

          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}


