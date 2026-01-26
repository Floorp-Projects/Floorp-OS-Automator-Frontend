/**
 * Action classification functions for workflow automation
 * Determines the type of action based on code analysis
 */

import type { Statement } from "@babel/types";

/**
 * Check if code represents a navigation action
 */
export function isNavigationAction(code: string): boolean {
  const navKeywords = [
    "goto",
    "navigate",
    "open",
    "visit",
    "newPage",
    "createPage",
  ];
  return navKeywords.some((keyword) => code.includes(keyword));
}

/**
 * Check if code represents an interaction action
 */
export function isInteractionAction(code: string): boolean {
  const interactionKeywords = [
    "click",
    "type",
    "fill",
    "select",
    "submit",
    "press",
    "hover",
    "focus",
  ];
  return interactionKeywords.some((keyword) => code.includes(keyword));
}

/**
 * Check if code represents a data extraction action
 */
export function isDataExtractionAction(code: string): boolean {
  const extractionKeywords = [
    "textContent",
    "innerHTML",
    "getAttribute",
    "evaluate",
    "$$eval",
    "$eval",
    "title",
  ];
  return extractionKeywords.some((keyword) => code.includes(keyword));
}

/**
 * Check if statement is a return statement
 */
export function isReturnStatement(statement: Statement): boolean {
  return statement.type === "ReturnStatement";
}

/**
 * Check if statement is a control flow statement
 */
export function isControlFlow(statement: Statement): boolean {
  return [
    "IfStatement",
    "ForStatement",
    "WhileStatement",
    "ForInStatement",
    "ForOfStatement",
    "TryStatement",
    "SwitchStatement",
  ].includes(statement.type);
}
