import React from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Collapsible,
  HStack,
  IconButton,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuCalendar,
  LuChevronDown,
  LuChevronRight,
  LuClock,
} from "react-icons/lu";
import type { WorkflowResult } from "@/gen/sapphillon/v1/workflow_pb";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTimestamp, formatDuration } from "@/lib/time-utils";

interface WorkflowExecutionTimelineProps {
  results: WorkflowResult[];
}

function ExecutionResultCard({
  result,
  isLatest,
}: {
  result: WorkflowResult;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = React.useState(isLatest);

  const isSuccess = result.resultType === 0;
  // WorkflowResultにはranAtのみがあり、実行時間の計算はできないのでスキップ
  const duration = 0;

  return (
    <Card.Root
      variant="outline"
      borderLeftWidth="4px"
      borderLeftColor={isSuccess ? "green.500" : "red.500"}
    >
      <Card.Body p={3}>
        <VStack align="stretch" gap={2}>
          {/* Header */}
          <HStack justify="space-between" gap={2}>
            <HStack gap={2} flex="1">
              <Badge
                colorPalette={isSuccess ? "green" : "red"}
                size="sm"
                fontWeight="medium"
              >
                {isSuccess ? "成功" : "失敗"}
              </Badge>
              <VStack align="start" gap={0} flex="1">
                {result.ranAt && (
                  <HStack gap={1} fontSize="xs" color="fg.muted">
                    <LuClock size={12} />
                    <Text>{formatTimestamp(result.ranAt, "ja-JP", true)}</Text>
                  </HStack>
                )}
              </VStack>
              {isLatest && (
                <Badge colorPalette="blue" size="sm">
                  最新
                </Badge>
              )}
            </HStack>
            <IconButton
              aria-label={expanded ? "折りたたむ" : "展開"}
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <LuChevronDown /> : <LuChevronRight />}
            </IconButton>
          </HStack>

          {/* Duration */}
          {duration > 0 && (
            <HStack gap={1} fontSize="xs" color="fg.muted">
              <LuClock size={12} />
              <Text>実行時間: {formatDuration(duration)}</Text>
            </HStack>
          )}

          {/* Expanded Content */}
          <Collapsible.Root open={expanded}>
            <Collapsible.Content>
              <VStack align="stretch" gap={2} mt={2}>
                <Separator />

                {/* Result Details */}
                {result.result && (
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1}>
                      実行結果:
                    </Text>
                    <Box
                      p={2}
                      bg="bg.subtle"
                      rounded="md"
                      fontSize="xs"
                      fontFamily="mono"
                      maxH="200px"
                      overflowY="auto"
                      css={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {result.result}
                    </Box>
                  </Box>
                )}

                {/* Error Details */}
                {!isSuccess && result.result && (
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      mb={1}
                      color="red.500"
                    >
                      エラー詳細:
                    </Text>
                    <Box
                      p={2}
                      bg="red.50"
                      borderWidth="1px"
                      borderColor="red.200"
                      rounded="md"
                      fontSize="xs"
                      fontFamily="mono"
                      maxH="200px"
                      overflowY="auto"
                      css={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        _dark: {
                          bg: "red.900/20",
                          borderColor: "red.800",
                        },
                      }}
                    >
                      {result.result}
                    </Box>
                  </Box>
                )}

                {/* Timestamps */}
                <Box>
                  <Text fontSize="xs" fontWeight="medium" mb={1}>
                    タイムスタンプ:
                  </Text>
                  <VStack
                    align="stretch"
                    gap={0.5}
                    fontSize="2xs"
                    color="fg.muted"
                  >
                    {result.ranAt && (
                      <HStack justify="space-between">
                        <Text>実行:</Text>
                        <Text>{formatTimestamp(result.ranAt, "ja-JP", true)}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Actions */}
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      // TODO: View full logs
                    }}
                  >
                    ログを表示
                  </Button>
                  {!isSuccess && (
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="blue"
                      onClick={() => {
                        // TODO: Retry execution
                      }}
                    >
                      再実行
                    </Button>
                  )}
                </HStack>
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export function WorkflowExecutionTimeline({
  results,
}: WorkflowExecutionTimelineProps) {
  // Sort by timestamp (newest first)
  const sortedResults = React.useMemo(() => {
    return [...results].sort((a, b) => {
      const aTime = a.ranAt ? Number(a.ranAt.seconds) : 0;
      const bTime = b.ranAt ? Number(b.ranAt.seconds) : 0;
      return bTime - aTime;
    });
  }, [results]);

  // Group by date
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, WorkflowResult[]> = {};
    sortedResults.forEach((result) => {
      if (!result.ranAt) return;
      const date = new Date(Number(result.ranAt.seconds) * 1000);
      const dateKey = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(result);
    });
    return groups;
  }, [sortedResults]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = results.length;
    const successful = results.filter((r) => r.resultType === 0).length;
    const failed = total - successful;
    const successRate = total > 0
      ? ((successful / total) * 100).toFixed(1)
      : "0";
    return { total, successful, failed, successRate };
  }, [results]);

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<LuCalendar />}
        title="実行履歴がありません"
        description="このワークフローはまだ実行されていません"
      />
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Statistics */}
      <Card.Root variant="subtle">
        <Card.Body p={3}>
          <HStack gap={4} justify="space-around" flexWrap="wrap">
            <VStack gap={0}>
              <Text fontSize="2xl" fontWeight="bold">
                {stats.total}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                総実行回数
              </Text>
            </VStack>
            <VStack gap={0}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {stats.successful}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                成功
              </Text>
            </VStack>
            <VStack gap={0}>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {stats.failed}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                失敗
              </Text>
            </VStack>
            <VStack gap={0}>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {stats.successRate}%
              </Text>
              <Text fontSize="xs" color="fg.muted">
                成功率
              </Text>
            </VStack>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Timeline */}
      <VStack align="stretch" gap={4}>
        {Object.entries(groupedResults).map((
          [dateKey, dateResults],
          groupIdx,
        ) => (
          <Box key={dateKey}>
            {/* Date Header */}
            <HStack gap={2} mb={2}>
              <LuCalendar size={16} color="var(--chakra-colors-fg-muted)" />
              <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                {dateKey}
              </Text>
              <Badge size="sm" colorPalette="gray">
                {dateResults.length}件
              </Badge>
            </HStack>

            {/* Results for this date */}
            <VStack align="stretch" gap={2} pl={6} position="relative">
              {/* Timeline line */}
              <Box
                position="absolute"
                left="10px"
                top="0"
                bottom="0"
                w="2px"
                bg="border"
              />

              {dateResults.map((result, idx) => (
                <ExecutionResultCard
                  key={result.id || idx}
                  result={result}
                  isLatest={groupIdx === 0 && idx === 0}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
