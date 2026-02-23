import {
  Box,
  Button,
  Card,
  Dialog,
  HStack,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuSparkles, LuUpload } from "react-icons/lu";

interface NewWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGenerate: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function NewWorkflowDialog({
  open,
  onOpenChange,
  onSelectGenerate,
  t,
}: NewWorkflowDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(details) => onOpenChange(details.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          maxW={{ base: "100vw", md: "600px" }}
          w={{ base: "100vw", md: "auto" }}
        >
          <Dialog.Header>
            <Heading size="md">{t("workflows.createNewWorkflow")}</Heading>
          </Dialog.Header>
          <Dialog.CloseTrigger />
          <Dialog.Body>
            <VStack gap={4} align="stretch" py={2}>
              <Text color="fg.muted">{t("workflows.chooseHowToCreate")}</Text>

              <Card.Root
                cursor="pointer"
                _hover={{ bg: "bg.subtle" }}
                onClick={onSelectGenerate}
              >
                <Card.Body>
                  <HStack gap={3} align="start">
                    <Box
                      p={3}
                      rounded="md"
                      bg="blue.500"
                      color="white"
                      flexShrink={0}
                    >
                      <LuSparkles size={24} />
                    </Box>
                    <VStack align="start" gap={1} flex="1">
                      <Text fontWeight="semibold" fontSize="md">
                        {t("workflows.generate")}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        {t("workflows.generateDescription")}
                      </Text>
                    </VStack>
                  </HStack>
                </Card.Body>
              </Card.Root>

              <Card.Root opacity={0.6} cursor="not-allowed">
                <Card.Body>
                  <HStack gap={3} align="start">
                    <Box
                      p={3}
                      rounded="md"
                      bg="gray.500"
                      color="white"
                      flexShrink={0}
                    >
                      <LuUpload size={24} />
                    </Box>
                    <VStack align="start" gap={1} flex="1">
                      <HStack gap={2} align="center">
                        <Text fontWeight="semibold" fontSize="md">
                          {t("workflows.import")}
                        </Text>
                        <Box
                          px={2}
                          py={0.5}
                          rounded="sm"
                          bg="orange.500"
                          fontSize="xs"
                          fontWeight="medium"
                          color="white"
                        >
                          {t("workflows.comingSoon")}
                        </Box>
                      </HStack>
                      <Text fontSize="sm" color="fg.muted">
                        {t("workflows.importDescription")}
                      </Text>
                    </VStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("workflows.cancel")}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
