/**
 * Workflow utility functions for Floorp OS Automator
 * Provides helper functions and type guards for Workflow operations
 */

import type { Workflow, WorkflowResult, WorkflowCode } from "@/gen/sapphillon/v1/workflow_pb";
import type { AllowedPermission } from "@/gen/sapphillon/v1/permission_pb";
import { WorkflowResultType } from "@/gen/sapphillon/v1/workflow_pb";

/**
 * Check if a workflow result is successful
 *
 * @param result - Workflow result to check
 * @returns true if the result is successful
 *
 * @example
 * ```ts
 * if (isWorkflowResultSuccess(latestResult)) {
 *   console.log("Workflow succeeded");
 * }
 * ```
 */
export function isWorkflowResultSuccess(result: WorkflowResult | undefined): boolean {
  return result?.resultType === WorkflowResultType.SUCCESS_UNSPECIFIED;
}

/**
 * Check if a workflow result is a failure
 *
 * @param result - Workflow result to check
 * @returns true if the result is a failure
 */
export function isWorkflowResultFailure(result: WorkflowResult | undefined): boolean {
  return result?.resultType === WorkflowResultType.FAILURE;
}

/**
 * Check if a workflow has ever been run
 *
 * @param workflow - Workflow to check
 * @returns true if the workflow has at least one result
 */
export function hasWorkflowRun(workflow: Workflow | undefined): boolean {
  return !!(workflow?.workflowResults && workflow.workflowResults.length > 0);
}

/**
 * Get the latest workflow result
 *
 * @param workflow - Workflow to get result from
 * @returns The latest result or undefined if no results exist
 */
export function getLatestWorkflowResult(workflow: Workflow | undefined): WorkflowResult | undefined {
  if (!workflow?.workflowResults || workflow.workflowResults.length === 0) {
    return undefined;
  }
  return workflow.workflowResults[workflow.workflowResults.length - 1];
}

/**
 * Get the latest workflow code
 *
 * @param workflow - Workflow to get code from
 * @returns The latest code or undefined if no code exists
 */
export function getLatestWorkflowCode(workflow: Workflow | undefined): WorkflowCode | undefined {
  if (!workflow?.workflowCode || workflow.workflowCode.length === 0) {
    return undefined;
  }
  return workflow.workflowCode[workflow.workflowCode.length - 1];
}

/**
 * Check if a workflow has any code
 *
 * @param workflow - Workflow to check
 * @returns true if the workflow has at least one code revision
 */
export function hasWorkflowCode(workflow: Workflow | undefined): boolean {
  return !!(workflow?.workflowCode && workflow.workflowCode.length > 0);
}

/**
 * Get the workflow's display name or a default fallback
 *
 * @param workflow - Workflow to get name from
 * @param defaultValue - Default value if no display name exists
 * @returns The workflow's display name or the default value
 */
export function getWorkflowDisplayName(
  workflow: Workflow | undefined,
  defaultValue: string = "Untitled Workflow",
): string {
  return workflow?.displayName?.trim() || defaultValue;
}

/**
 * Check if a workflow has a description
 *
 * @param workflow - Workflow to check
 * @returns true if the workflow has a non-empty description
 */
export function hasWorkflowDescription(workflow: Workflow | undefined): boolean {
  return !!(workflow?.description?.trim());
}

/**
 * Get the workflow status based on latest result
 *
 * @param workflow - Workflow to check
 * @returns The workflow status: "success", "failure", "never-run", or "unknown"
 */
export type WorkflowStatus = "success" | "failure" | "never-run" | "unknown";

export function getWorkflowStatus(workflow: Workflow | undefined): WorkflowStatus {
  if (!workflow) {
    return "unknown";
  }

  if (!hasWorkflowRun(workflow)) {
    return "never-run";
  }

  const latestResult = getLatestWorkflowResult(workflow);
  if (isWorkflowResultSuccess(latestResult)) {
    return "success";
  }
  if (isWorkflowResultFailure(latestResult)) {
    return "failure";
  }

  return "unknown";
}

/**
 * Check if a workflow is valid (has required fields)
 *
 * @param workflow - Workflow to validate
 * @returns true if the workflow has an ID and display name
 */
export function isValidWorkflow(workflow: Workflow | undefined): boolean {
  return !!(workflow?.id && workflow.displayName);
}

/**
 * Check if a workflow has specific permissions
 *
 * @param workflow - Workflow to check
 * @param permissionType - Permission type to check for
 * @returns true if the workflow has the specified permission
 */
export function hasWorkflowPermission(
  workflow: Workflow | undefined,
  permissionType: AllowedPermission,
): boolean {
  const latestCode = getLatestWorkflowCode(workflow);
  if (!latestCode?.allowedPermissions) {
    return false;
  }
  return latestCode.allowedPermissions.some((p) => p === permissionType);
}

/**
 * Get workflow execution duration
 * Note: This requires start and end timestamps, which may not be available in all results
 *
 * @param result - Workflow result to calculate duration from
 * @returns Duration in milliseconds or undefined if timestamps are not available
 */
export function getWorkflowExecutionDuration(result: WorkflowResult | undefined): number | undefined {
  if (!result?.ranAt) {
    return undefined;
  }

  // Note: Currently WorkflowResult only has ranAt (start time)
  // To calculate duration, we'd need an endedAt field
  // This is a placeholder for future implementation
  return undefined;
}

/**
 * Compare two workflows by update time
 *
 * @param a - First workflow
 * @param b - Second workflow
 * @returns Negative if a is newer, positive if b is newer, 0 if equal
 */
export function compareWorkflowsByUpdateTime(a: Workflow, b: Workflow): number {
  const aTime = a.updatedAt ? Number(a.updatedAt.seconds) : 0;
  const bTime = b.updatedAt ? Number(b.updatedAt.seconds) : 0;
  return bTime - aTime; // Descending order (newest first)
}

/**
 * Compare two workflows by name
 *
 * @param a - First workflow
 * @param b - Second workflow
 * @returns Negative if a comes before b alphabetically, positive if after
 */
export function compareWorkflowsByName(a: Workflow, b: Workflow): number {
  const aName = (a.displayName || "").toLowerCase();
  const bName = (b.displayName || "").toLowerCase();
  return aName.localeCompare(bName);
}

/**
 * Filter workflows by search term
 *
 * @param workflows - Workflows to filter
 * @param searchTerm - Search term to match against display name and description
 * @returns Filtered workflows
 */
export function filterWorkflowsBySearchTerm(
  workflows: Workflow[],
  searchTerm: string,
): Workflow[] {
  if (!searchTerm.trim()) {
    return workflows;
  }

  const term = searchTerm.toLowerCase();
  return workflows.filter(
    (workflow) =>
      workflow.displayName?.toLowerCase().includes(term) ||
      workflow.description?.toLowerCase().includes(term),
  );
}

/**
 * Check if a workflow can be executed
 *
 * @param workflow - Workflow to check
 * @returns true if the workflow has code and can be executed
 */
export function canExecuteWorkflow(workflow: Workflow | undefined): boolean {
  return hasWorkflowCode(workflow);
}

/**
 * Get workflow statistics
 *
 * @param workflow - Workflow to analyze
 * @returns Object containing workflow statistics
 */
export interface WorkflowStats {
  totalResults: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-1
  hasCode: boolean;
  lastRunTime: Date | null;
}

export function getWorkflowStats(workflow: Workflow | undefined): WorkflowStats {
  if (!workflow) {
    return {
      totalResults: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      hasCode: false,
      lastRunTime: null,
    };
  }

  const results = workflow.workflowResults || [];
  const successCount = results.filter(
    (r) => r.resultType === WorkflowResultType.SUCCESS_UNSPECIFIED,
  ).length;
  const failureCount = results.filter(
    (r) => r.resultType === WorkflowResultType.FAILURE,
  ).length;

  const lastRunTime =
    results.length > 0 && results[results.length - 1].ranAt
      ? new Date(Number(results[results.length - 1].ranAt!.seconds) * 1000)
      : null;

  return {
    totalResults: results.length,
    successCount,
    failureCount,
    successRate: results.length > 0 ? successCount / results.length : 0,
    hasCode: hasWorkflowCode(workflow),
    lastRunTime,
  };
}
