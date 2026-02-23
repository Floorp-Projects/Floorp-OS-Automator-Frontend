/**
 * @fileoverview Floorp 進捗ウィンドウとの通信ユーティリティ
 */

export interface WorkflowProgressStep {
  id: string;
  functionId: string;
  functionName: string;
  status: "pending" | "running" | "completed" | "error";
  startedAt?: number;
  completedAt?: number;
}

export interface WorkflowProgressMessage {
  type:
    | "workflow-progress-start"
    | "workflow-progress-update"
    | "workflow-progress-complete"
    | "workflow-progress-error";
  workflowId: string;
  workflowName?: string;
  steps?: WorkflowProgressStep[];
  currentStepIndex?: number;
  status?: "idle" | "running" | "completed" | "error";
}

declare global {
  interface Window {
    OSAutomotor?: {
      sendWorkflowProgress: (
        data: WorkflowProgressMessage
      ) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

/**
 * Floorp の進捗ウィンドウへメッセージを送信
 */
export function sendProgressMessage(message: WorkflowProgressMessage): void {
  void message; // Prevent unused variable error
  // Disabled by user request
  // if (window.OSAutomotor?.sendWorkflowProgress) {
  //   window.OSAutomotor.sendWorkflowProgress(message).catch(() => {
  //     // Ignore errors silently
  //   });
  // }
}

/**
 * プラグイン関数 ID からステップリストを生成
 */
export function parseWorkflowSteps(
  pluginFunctionIds: string[]
): WorkflowProgressStep[] {
  return pluginFunctionIds.map((functionId, index) => ({
    id: `step-${index}`,
    functionId,
    functionName: functionId.split(".").pop() || functionId,
    status: "pending" as const,
  }));
}

/**
 * ワークフロー実行開始を通知
 */
export function notifyWorkflowStart(
  workflowId: string,
  workflowName: string,
  steps: WorkflowProgressStep[]
): void {
  sendProgressMessage({
    type: "workflow-progress-start",
    workflowId,
    workflowName,
    steps,
    currentStepIndex: 0,
    status: "running",
  });
}

/**
 * ステップ進捗を通知
 */
export function notifyStepUpdate(
  workflowId: string,
  steps: WorkflowProgressStep[],
  currentStepIndex: number
): void {
  sendProgressMessage({
    type: "workflow-progress-update",
    workflowId,
    steps,
    currentStepIndex,
    status: "running",
  });
}

/**
 * ワークフロー完了を通知
 */
export function notifyWorkflowComplete(
  workflowId: string,
  steps: WorkflowProgressStep[]
): void {
  sendProgressMessage({
    type: "workflow-progress-complete",
    workflowId,
    steps,
    currentStepIndex: steps.length - 1,
    status: "completed",
  });
}

/**
 * ワークフローエラーを通知
 */
export function notifyWorkflowError(
  workflowId: string,
  steps: WorkflowProgressStep[],
  currentStepIndex: number
): void {
  sendProgressMessage({
    type: "workflow-progress-error",
    workflowId,
    steps,
    currentStepIndex,
    status: "error",
  });
}
