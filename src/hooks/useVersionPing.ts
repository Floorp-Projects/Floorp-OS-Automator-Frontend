/**
 * @fileoverview バックエンドのバージョン確認とヘルスチェック
 *
 * @module hooks/useVersionPing
 */

import React from "react";
import { clients } from "@/lib/grpc-clients";
import { WorkflowRunContext } from "@/contexts/WorkflowRunContext";

/**
 * gRPC接続のステータス
 */
export type GrpcStatus = "connecting" | "connected" | "disconnected";

/**
 * バージョンPingフックの戻り値
 */
export interface UseVersionPingReturn {
  /** 現在の接続ステータス */
  status: GrpcStatus;
  /** バックエンドのバージョン文字列 */
  version: string;
  /** 最後に発生したエラー（存在する場合） */
  error: unknown;
  /** 最後に更新された時刻（Unixタイムスタンプ） */
  lastUpdated: number;
  /** 手動で再取得する関数 */
  refetch: () => Promise<void>;
}

/**
 * バックエンドのバージョン情報を定期的に取得するフック
 *
 * 定期的にバックエンドにpingを送り、バージョン情報と接続状態を監視します。
 * ヘルスチェックやステータス表示に使用します。
 *
 * @param intervalMs - ping間隔（ミリ秒）。デフォルトは10秒
 * @returns バージョン情報と接続状態
 *
 * @example
 * ```tsx
 * function StatusIndicator() {
 *   const { status, version, lastUpdated } = useVersionPing(5000); // 5秒間隔
 *
 *   return (
 *     <div>
 *       <Badge colorScheme={status === "connected" ? "green" : "red"}>
 *         {status}
 *       </Badge>
 *       <Text>Version: {version || "Unknown"}</Text>
 *       <Text>Last checked: {new Date(lastUpdated).toLocaleTimeString()}</Text>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 手動で再取得
 * function RefreshButton() {
 *   const { refetch, status } = useVersionPing();
 *
 *   return (
 *     <Button onClick={refetch} isLoading={status === "connecting"}>
 *       Refresh
 *     </Button>
 *   );
 * }
 * ```
 */
export function useVersionPing(intervalMs = 10000): UseVersionPingReturn {
  const [status, setStatus] = React.useState<GrpcStatus>("connecting");
  const [version, setVersion] = React.useState<string>("");
  const [error, setError] = React.useState<unknown>(undefined);
  const [lastUpdated, setLastUpdated] = React.useState<number>(0);

  // ワークフロー実行中はpingを一時停止する（バックエンドがcurrent_threadランタイムのため、
  // 長時間ブロックされるとpingも失敗し、UIが"disconnected"表示になる）
  const workflowCtx = React.useContext(WorkflowRunContext);
  const isWorkflowRunning = workflowCtx?.running ?? false;

  const refetch = React.useCallback(async () => {
    if (isWorkflowRunning) {
      // ワークフロー実行中はスキップ — 前回のステータスを維持
      return;
    }
    try {
      setStatus("connecting");
      setError(undefined);
      const res = await clients.version.getVersion({});
      setVersion(res.version?.version ?? "");
      setStatus("connected");
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e);
      setStatus("disconnected");
    }
  }, [isWorkflowRunning]);

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refetch();
    };
    tick();
    const t = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [intervalMs, refetch]);

  return { status, version, error, lastUpdated, refetch } as const;
}
