import { Button, Flex, HStack, Text } from "@chakra-ui/react";

interface WorkflowPaginationProps {
  count: number;
  hasMore: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  messages: {
    showing: string;
    showingPlural: string;
    moreAvailable: string;
    previous: string;
    next: string;
  };
}

export function WorkflowPagination({
  count,
  hasMore,
  hasPrevious,
  onNext,
  onPrevious,
  messages,
}: WorkflowPaginationProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Flex justify="space-between" align="center" mt={4} gap={4}>
      <Text fontSize="xs" color="fg.muted">
        {count === 1
          ? messages.showing.replace("{count}", String(count))
          : messages.showingPlural.replace("{count}", String(count))}
        {hasMore && ` ${messages.moreAvailable}`}
      </Text>
      <HStack gap={2}>
        {hasPrevious && (
          <Button size="sm" variant="outline" onClick={onPrevious}>
            {messages.previous}
          </Button>
        )}
        {hasMore && (
          <Button size="sm" variant="outline" onClick={onNext}>
            {messages.next}
          </Button>
        )}
      </HStack>
    </Flex>
  );
}
