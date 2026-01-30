/**
 * @fileoverview ターミナル風ログ表示コンポーネント
 *
 * 全文選択可能なターミナルスタイルのログ表示。
 * LogRowのように1行ずつ区切らず、連続したテキストとして表示する。
 * 外部からコピー・ダウンロード機能を呼び出し可能。
 */

import React from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import type { GenerationEvent } from "./utils";
import { toRows } from "./row-utils";
import { summarize } from "./row-utils";
import { fmtTime } from "./utils";
import { useI18n } from "@/hooks/useI18n";

export interface TerminalConsoleProps {
    events: GenerationEvent[];
    streaming: boolean;
    /** 簡潔モード：時刻とプレフィックスを省略し、重要な情報のみを表示 */
    compact?: boolean;
}

/** TerminalConsole の外部公開メソッド */
export interface TerminalConsoleHandle {
    copy: () => Promise<void>;
    download: () => void;
    scrollToTop: () => void;
    scrollToBottom: () => void;
}

/**
 * イベントのkindに応じたプレフィックスを取得
 */
function getKindPrefix(kind: string): string {
    switch (kind) {
        case "error":
            return "[ERROR]";
        case "done":
            return "[DONE]";
        case "progress":
            return "[...]";
        default:
            return "[INFO]";
    }
}

/**
 * イベントのkindに応じた色を取得
 */
function getKindColor(kind: string): string {
    switch (kind) {
        case "error":
            return "red.400";
        case "done":
            return "green.400";
        case "progress":
            return "yellow.400";
        default:
            return "inherit";
    }
}

export const TerminalConsole = React.forwardRef<
    TerminalConsoleHandle,
    TerminalConsoleProps
>(({ events, streaming, compact = false }, ref) => {
    const { t } = useI18n();
    const [autoScroll, setAutoScroll] = React.useState(true);
    const viewportRef = React.useRef<HTMLDivElement | null>(null);
    const preRef = React.useRef<HTMLPreElement | null>(null);

    const visible = React.useMemo(() => {
        return [...events].sort((a, b) => a.t - b.t);
    }, [events]);

    const rows = toRows(visible);

    // ログをテキスト形式に変換
    const logLines: { text: string; kind: string; isSeparator: boolean }[] =
        React.useMemo(() => {
            const lines: {
                text: string;
                kind: string;
                isSeparator: boolean;
            }[] = [];

            for (const row of rows) {
                if (row.type === "sep") {
                    // compact モードではセパレーターを簡素化
                    if (compact) {
                        lines.push({
                            text: `── ${row.label} ──`,
                            kind: "separator",
                            isSeparator: true,
                        });
                    } else {
                        lines.push({
                            text: `━━━ ${row.label} ━━━`,
                            kind: "separator",
                            isSeparator: true,
                        });
                    }
                } else {
                    const e = row.event;
                    const summary = summarize(e);
                    if (compact) {
                        // compact モードでは時刻と [INFO] を省略
                        const prefix = e.kind === "error" ? "❌ "
                                     : e.kind === "done" ? "✓ "
                                     : "";
                        lines.push({
                            text: `${prefix}${summary}`,
                            kind: e.kind,
                            isSeparator: false,
                        });
                    } else {
                        // 通常モード
                        const time = fmtTime(e.t);
                        const prefix = getKindPrefix(e.kind);
                        lines.push({
                            text: `${time} ${prefix} ${summary}`,
                            kind: e.kind,
                            isSeparator: false,
                        });
                    }
                }
            }

            return lines;
        }, [rows, compact]);

    // プレーンテキストとしてのログ出力（コピー/ダウンロード用）
    const plainText = React.useMemo(() => {
        return logLines.map((l) => l.text).join("\n");
    }, [logLines]);

    // マウント時に最下部に固定（ストリーミング開始時）
    React.useLayoutEffect(() => {
        const el = viewportRef.current;
        if (el && streaming) {
            el.scrollTop = el.scrollHeight;
        }
    }, [streaming]);

    // Auto scroll behavior
    React.useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        if (autoScroll) el.scrollTop = el.scrollHeight;
    }, [visible, autoScroll]);

    const onScroll = () => {
        const el = viewportRef.current;
        if (!el) return;
        const nearBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
        if (!nearBottom && autoScroll) setAutoScroll(false);
        if (nearBottom && !autoScroll) setAutoScroll(true);
    };

    // 最上部/最下部へスクロール
    const scrollToTop = React.useCallback(() => {
        const el = viewportRef.current;
        if (el) {
            el.scrollTop = 0;
            setAutoScroll(false);
        }
    }, []);

    const scrollToBottom = React.useCallback(() => {
        const el = viewportRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
            setAutoScroll(true);
        }
    }, []);

    // コピー処理
    const copy = React.useCallback(async () => {
        await navigator.clipboard.writeText(plainText);
    }, [plainText]);

    // ダウンロード処理
    const download = React.useCallback(() => {
        const blob = new Blob([plainText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `log-${
            new Date().toISOString().replace(/[:.]/g, "-")
        }.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [plainText]);

    // 外部からアクセス可能なメソッドを公開
    React.useImperativeHandle(ref, () => ({
        copy,
        download,
        scrollToTop,
        scrollToBottom,
    }), [copy, download, scrollToTop, scrollToBottom]);

    if (visible.length === 0) {
        return (
            <VStack align="stretch" h="full" minH={0} gap={0}>
                <Box
                    ref={viewportRef}
                    minH={0}
                    h="full"
                    overflowY="auto"
                    bg="gray.950"
                    _light={{ bg: "gray.900" }}
                    borderRadius="md"
                    p={3}
                >
                    <Text color="gray.500" fontFamily="mono" fontSize="sm">
                        {events.length === 0
                            ? streaming
                                ? t("console.running")
                                : t("console.waiting")
                            : t("console.noLogs")}
                    </Text>
                </Box>
            </VStack>
        );
    }

    return (
        <Box h="full" minH={0}>
            <Box
                ref={viewportRef}
                minH={0}
                h="full"
                overflowY="auto"
                onScroll={onScroll}
                bg="gray.950"
                _light={{ bg: "gray.900" }}
                borderRadius="md"
                p={3}
                css={{ overflowAnchor: "none" }}
                className="scroll-container"
            >
                <Box
                    as="pre"
                    ref={preRef}
                    m={0}
                    p={0}
                    fontFamily="mono"
                    fontSize={{ base: "xs", md: "sm" }}
                    lineHeight="1.6"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    color="gray.100"
                    css={{
                        userSelect: "text",
                        cursor: "text",
                    }}
                >
                    {logLines.map((line, i) => (
                        <React.Fragment key={i}>
                            {line.isSeparator
                                ? (
                                    <Text
                                        as="span"
                                        display="block"
                                        color="cyan.400"
                                        fontWeight="bold"
                                        my={1}
                                    >
                                        {line.text}
                                    </Text>
                                )
                                : (
                                    <Text
                                        as="span"
                                        display="block"
                                        color={getKindColor(line.kind)}
                                    >
                                        {line.text}
                                    </Text>
                                )}
                        </React.Fragment>
                    ))}
                    {streaming && (
                        <Text
                            as="span"
                            color="gray.500"
                            className="cursor-blink"
                        >
                            █
                        </Text>
                    )}
                </Box>
            </Box>
        </Box>
    );
});

TerminalConsole.displayName = "TerminalConsole";
