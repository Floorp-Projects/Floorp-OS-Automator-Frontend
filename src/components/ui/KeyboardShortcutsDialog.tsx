import React from "react";
import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  Kbd,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuCommand, LuSearch, LuX } from "react-icons/lu";
import type { KeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { formatShortcut } from "@/hooks/useKeyboardShortcut";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <HStack
      justify="space-between"
      gap={4}
      p={2}
      rounded="md"
      _hover={{ bg: "bg.subtle" }}
      cursor={shortcut.disabled ? "not-allowed" : "default"}
      opacity={shortcut.disabled ? 0.5 : 1}
    >
      <Text fontSize="sm" flex="1">
        {shortcut.description}
      </Text>
      <HStack gap={1}>
        {formatShortcut(shortcut).split(" + ").map((key, idx) => (
          <Kbd key={idx} fontSize="xs">
            {key}
          </Kbd>
        ))}
      </HStack>
    </HStack>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || "その他";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    return groups;
  }, [shortcuts]);

  // Filter shortcuts by search query
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedShortcuts;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, KeyboardShortcut[]> = {};

    Object.entries(groupedShortcuts).forEach(([category, categoryShortcuts]) => {
      const matchingShortcuts = categoryShortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(query) ||
          s.key.toLowerCase().includes(query)
      );

      if (matchingShortcuts.length > 0) {
        filtered[category] = matchingShortcuts;
      }
    });

    return filtered;
  }, [groupedShortcuts, searchQuery]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      size={{ base: "full", md: "lg" }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          maxW={{ base: "100vw", md: "700px" }}
          maxH={{ base: "100vh", md: "80vh" }}
        >
          <Dialog.Header>
            <HStack justify="space-between" w="full">
              <HStack gap={2}>
                <LuCommand />
                <Text fontWeight="medium" fontSize={{ base: "md", md: "lg" }}>
                  キーボードショートカット
                </Text>
              </HStack>
              <Dialog.CloseTrigger asChild>
                <IconButton aria-label="閉じる" variant="ghost" size="sm" color="fg">
                  <LuX />
                </IconButton>
              </Dialog.CloseTrigger>
            </HStack>
          </Dialog.Header>

          <Dialog.Body p={0} display="flex" flexDir="column">
            {/* Search */}
            <Box px={4} pt={2} pb={3} borderBottomWidth="1px">
              <HStack
                borderWidth="1px"
                rounded="md"
                px={3}
                py={1}
                gap={2}
                bg="bg"
                _focusWithin={{
                  outline: "2px solid",
                  outlineColor: "accent.focusRing",
                }}
              >
                <LuSearch size={16} color="var(--chakra-colors-fg-muted)" />
                <Input
                  placeholder="ショートカットを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                  flex="1"
                  border="none"
                  outline="none"
                  bg="transparent"
                />
                {searchQuery && (
                  <IconButton
                    aria-label="クリア"
                    size="xs"
                    variant="ghost"
                    onClick={() => setSearchQuery("")}
                  >
                    <LuX />
                  </IconButton>
                )}
              </HStack>
            </Box>

            {/* Shortcuts List */}
            <Box flex="1" overflowY="auto" p={4}>
              {Object.keys(filteredGroups).length === 0 ? (
                <VStack gap={2} py={8}>
                  <Text color="fg.muted">ショートカットが見つかりません</Text>
                </VStack>
              ) : (
                <VStack align="stretch" gap={4}>
                  {Object.entries(filteredGroups).map(([category, categoryShortcuts]) => (
                    <Box key={category}>
                      <HStack gap={2} mb={2}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {category}
                        </Text>
                        <Badge size="xs" colorPalette="gray">
                          {categoryShortcuts.length}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" gap={0.5}>
                        {categoryShortcuts.map((shortcut) => (
                          <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            <Separator />

            {/* Footer */}
            <Box px={4} py={3}>
              <Text fontSize="xs" color="fg.muted">
                プラットフォームに応じて、⌘（Mac）または Ctrl（Windows/Linux）が使用されます
              </Text>
            </Box>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}


