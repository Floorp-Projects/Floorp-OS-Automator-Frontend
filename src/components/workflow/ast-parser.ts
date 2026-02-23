/**
 * AST Parser utilities for workflow automation
 * Parses workflow code and extracts the workflow function body
 */

import * as parser from "@babel/parser";
import * as t from "@babel/types";
import type { FunctionDeclaration } from "@babel/types";

export interface ParseResult {
  workflowBody: t.Statement[] | null;
  parseError: Error | null;
}

export function parseWorkflowCode(code: string): ParseResult {
  if (!code) return { workflowBody: null, parseError: null };

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    // Look for workflow function: function workflow() { ... }
    // Support both sync and async functions
    // Look for: function workflow(), async function workflow(), or export async function workflow()
    let workflowFunction = ast.program.body.find(
      (node) =>
        node.type === "FunctionDeclaration" && node.id?.name === "workflow"
    ) as FunctionDeclaration | undefined;

    // Also check for exported functions
    if (!workflowFunction) {
      const exportNode = ast.program.body.find(
        (node) =>
          node.type === "ExportNamedDeclaration" &&
          node.declaration?.type === "FunctionDeclaration" &&
          (node.declaration as FunctionDeclaration).id?.name === "workflow"
      );
      if (exportNode && exportNode.type === "ExportNamedDeclaration") {
        workflowFunction = exportNode.declaration as FunctionDeclaration;
      }
    }

    // Check for export default function workflow()
    if (!workflowFunction) {
      const defaultExport = ast.program.body.find(
        (node) =>
          node.type === "ExportDefaultDeclaration" &&
          node.declaration.type === "FunctionDeclaration" &&
          (node.declaration as FunctionDeclaration).id?.name === "workflow"
      );
      if (defaultExport && defaultExport.type === "ExportDefaultDeclaration") {
        workflowFunction = defaultExport.declaration as FunctionDeclaration;
      }
    }

    if (!workflowFunction) {
      return {
        workflowBody: null,
        parseError: new Error("`workflow()` function not found."),
      };
    }

    return { workflowBody: workflowFunction.body.body, parseError: null };
  } catch (error) {
    if (error instanceof Error) {
      return { workflowBody: null, parseError: error };
    }
    return {
      workflowBody: null,
      parseError: new Error("Unknown parsing error"),
    };
  }
}
