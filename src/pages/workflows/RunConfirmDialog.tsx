import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlay, LuShield } from "react-icons/lu";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { WorkflowFunctionList } from "@/components/workflow/WorkflowFunctionList";
import { PermissionList } from "@/components/workflow/PermissionList";
import { useI18n } from "@/hooks/useI18n";
import { PermissionLevel } from "@/gen/sapphillon/v1/permission_pb";

interface RunConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workflow: React.ComponentProps<typeof WorkflowCanvas>["workflow"] | null;
  latestCode: React.ComponentProps<typeof WorkflowCanvas>["workflow"]["workflowCode"][0] | null;
  running: boolean;
}

export function RunConfirmDialog({
  open,
  onClose,
  onConfirm,
  workflow,
  latestCode,
  running,
}: RunConfirmDialogProps) {
  const { t } = useI18n();
  const [riskAcknowledged, setRiskAcknowledged] = React.useState(false);
  const [showDetailView, setShowDetailView] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setRiskAcknowledged(false);
      setShowDetailView(false);
    }
  }, [open]);

  const permissions = latestCode?.allowedPermissions || [];
  const hasPermissions = permissions.length > 0;

  // Detect high-risk operations
  const highRiskCount = React.useMemo(() => {
    if (!latestCode?.pluginPackages) return 0;
    let count = 0;
    for (const pkg of latestCode.pluginPackages) {
      for (const func of pkg.functions) {
        for (const perm of func.permissions) {
          if (
            perm.permissionLevel === PermissionLevel.HIGH ||
            perm.permissionLevel === PermissionLevel.CRITICAL
          ) {
            count++;
            break;
          }
        }
      }
    }
    return count;
  }, [latestCode]);

  const hasHighRisk = highRiskCount > 0;
  const canConfirm = !hasHighRisk || riskAcknowledged;

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="600px" maxH="80vh" overflow="hidden">
          <Dialog.Header>
            <HStack gap={2}>
              <Box
                p={1.5}
                rounded="md"
                bg="orange.100"
                _dark={{ bg: "orange.900/30" }}
              >
                <LuShield size={16} color="var(--chakra-colors-orange-500)" />
              </Box>
              <Heading size="sm">{t("run.confirmTitle")}</Heading>
            </HStack>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          <Dialog.Body overflow="auto">
            <VStack align="stretch" gap={3}>
              {/* Workflow name */}
              <Box>
                <Text fontWeight="medium" fontSize="sm">
                  {workflow?.displayName || t("common.untitledWorkflow")}
                </Text>
                {workflow?.description && (
                  <Text fontSize="xs" color="fg.muted">
                    {workflow.description}
                  </Text>
                )}
              </Box>

              {/* Required permissions */}
              {hasPermissions && (
                <Card.Root
                  bg="orange.50"
                  _dark={{
                    bg: "orange.900/20",
                    borderColor: "orange.800",
                  }}
                  borderWidth="1px"
                  borderColor="orange.200"
                >
                  <Card.Body p={3}>
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <LuShield size={14} color="var(--chakra-colors-orange-500)" />
                          <Text fontWeight="medium" fontSize="sm">
                            {t("agent.requiredPermissions")}
                          </Text>
                        </HStack>
                        <Badge
                          colorPalette={permissions.length > 3 ? "orange" : "blue"}
                          size="xs"
                        >
                          {permissions.length} {t("agent.permissionCount")}
                        </Badge>
                      </HStack>
                      <PermissionList permissions={permissions} />
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Workflow steps */}
              {workflow && (
                <Card.Root maxH="200px" overflow="hidden">
                  <Card.Body p={0} display="flex" flexDirection="column">
                    <HStack
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      justify="space-between"
                    >
                      <Text fontWeight="medium" fontSize="sm">
                        {t("agent.workflowSteps")}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setShowDetailView(!showDetailView)}
                        fontSize="xs"
                      >
                        {showDetailView ? t("agent.compactView") : t("agent.detailView")}
                      </Button>
                    </HStack>
                    <Box flex={1} overflow="auto">
                      {showDetailView ? (
                        <WorkflowCanvas workflow={workflow} withBackground={false} />
                      ) : (
                        <Box p={2}>
                          <WorkflowFunctionList workflow={workflow} />
                        </Box>
                      )}
                    </Box>
                  </Card.Body>
                </Card.Root>
              )}

              {/* High-risk confirmation */}
              {hasHighRisk && (
                <HStack
                  gap={2}
                  align="center"
                  px={2}
                  py={2}
                  rounded="md"
                  bg="red.50"
                  borderWidth="1px"
                  borderColor={riskAcknowledged ? "green.400" : "red.300"}
                  _dark={{
                    bg: "red.950/50",
                    borderColor: riskAcknowledged ? "green.600" : "red.700",
                  }}
                >
                  <Checkbox.Root
                    checked={riskAcknowledged}
                    onCheckedChange={(e) => setRiskAcknowledged(!!e.checked)}
                    colorPalette="green"
                    size="sm"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                  <Text fontSize="xs" color="red.700" _dark={{ color: "red.300" }}>
                    {t("agent.highRiskAcknowledge")}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap={2}>
              <Button variant="outline" size="sm" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button
                colorPalette={canConfirm ? "floorp" : "gray"}
                size="sm"
                onClick={onConfirm}
                disabled={running || !canConfirm}
              >
                {running ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <LuPlay size={14} />
                    {t("run.title")}
                  </>
                )}
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
