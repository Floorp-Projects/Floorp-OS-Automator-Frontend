/**
 * @fileoverview ワークフローコンポーネントのエクスポート集約
 *
 * @module components/workflow
 */
export { WorkflowExecutionTimeline } from "./WorkflowExecutionTimeline";

// メインコンポーネント
export { WorkflowCanvas } from "./WorkflowCanvas";
export { ActionNode } from "./ActionNode";
export { NodeContainer } from "./NodeContainer";
export { WorkflowProgressDots } from "./WorkflowProgressDots";
export { WorkflowFunctionList } from "./WorkflowFunctionList";
export { hasHighRiskFunctions } from "./workflow-utils";

// ユーティリティ
export {
  generateCode,
  generateCompactCode,
  generateReadableCode,
} from "./utils/code-generator";
export { oneLine, splitLines, escapeCode, joinTexts } from "./utils/text-utils";
export { parseWorkflowCode, stripTypeScriptSyntax } from "./ast-utils";
export { groupStatementsIntoActions } from "./action-grouper";

// 定数
export {
  INDENT,
  NODE_TYPES,
  ACTION_TYPES,
  IMPORTANCE_LEVELS,
  ACTION_COLORS,
  NODE_COLORS,
  ANIMATIONS,
  IMPORTANT_FUNCTIONS,
  VIEW_MODES,
  MAX_CODE_LINES,
  MAX_NEST_DEPTH,
  getActionColor,
  getNodeColor,
  isImportantFunction,
} from "./constants";

// 型定義
export type {
  WorkflowCanvasProps,
  WorkflowAction,
  ActionNodeProps,
  AstNodeProps,
  NodeContainerProps,
  BodyRendererProps,
  FunctionDefinition,
  ParsedWorkflow,
  ViewState,
} from "./types";

export type {
  NodeType,
  ActionType,
  ImportanceLevel,
  ViewMode,
} from "./constants";
