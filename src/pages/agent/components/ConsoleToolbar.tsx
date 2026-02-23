/**
 * @fileoverview コンソールツールバー
 *
 * コピー・ダウンロードボタンを提供
 *
 * @module pages/agent/components/ConsoleToolbar
 */

import React from "react";
import { HStack, IconButton } from "@chakra-ui/react";
import { LuCheck, LuClipboard, LuDownload } from "react-icons/lu";
import type { TerminalConsoleHandle } from "@/components/console";
import { Tooltip } from "@/components/ui/tooltip";
import { useI18n } from "@/hooks/useI18n";

interface ConsoleToolbarProps {
    consoleRef: React.RefObject<TerminalConsoleHandle | null>;
}

export function ConsoleToolbar({ consoleRef }: ConsoleToolbarProps) {
    const { t } = useI18n();
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        await consoleRef.current?.copy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <HStack gap={1}>
            <Tooltip content={copied ? t("console.copied") : t("console.copy")}>
                <IconButton
                    aria-label={t("console.copy")}
                    size="xs"
                    variant="ghost"
                    color={copied ? "green.500" : "fg.muted"}
                    onClick={handleCopy}
                >
                    {copied ? <LuCheck size={14} /> : <LuClipboard size={14} />}
                </IconButton>
            </Tooltip>
            <Tooltip content={t("console.download")}>
                <IconButton
                    aria-label={t("console.download")}
                    size="xs"
                    variant="ghost"
                    color="fg.muted"
                    onClick={() => consoleRef.current?.download()}
                >
                    <LuDownload size={14} />
                </IconButton>
            </Tooltip>
        </HStack>
    );
}
