/**
 * Code description utilities for workflow automation
 * Analyzes code and generates human-readable descriptions
 */

import type { Statement, Expression } from "@babel/types";
import generate from "@babel/generator";

/**
 * Generate code string from AST node
 */
export function generateCode(node: Statement | Expression): string {
  try {
    // @ts-expect-error @babel/generator's ESM/CJS module is a bit weird.
    const generator = generate.default ?? generate;
    const { code } = generator(node, {
      compact: true,
      comments: false,
      concise: true,
    });
    return code;
  } catch {
    return "";
  }
}

/**
 * Extract variable name from a variable declaration statement
 */
export function extractVariableName(statement: Statement): string | null {
  if (statement.type === "VariableDeclaration") {
    const decl = statement.declarations[0];
    if (decl && decl.id.type === "Identifier") {
      return decl.id.name;
    }
  }
  return null;
}

/**
 * Extract string value from code
 */
export function extractStringValue(code: string): string | null {
  const match = code.match(/["']([^"']+)["']/);
  return match ? match[1] : null;
}

/**
 * Extract initialization value from code
 */
export function extractInitValue(code: string): string | null {
  // Extract value from "const xxx = yyy;" pattern
  const match = code.match(/=\s*(.+?)(?:;|$)/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Convert condition expression to natural language
 */
export function describeCondition(code: string): string {
  // Simple cleanup
  const cleaned = code.trim();

  // Convert operators to Japanese with code wrapped in backticks
  const result = cleaned
    .replace(/===/g, " が ")
    .replace(/==/g, " が ")
    .replace(/!==/g, " が異なる ")
    .replace(/!=/g, " が異なる ")
    .replace(/>=/g, " 以上 ")
    .replace(/<=/g, " 以下 ")
    .replace(/>/g, " より大きい ")
    .replace(/</g, " より小さい ")
    .replace(/&&/g, " かつ ")
    .replace(/\|\|/g, " または ");

  return "`" + result + "`";
}

/**
 * Generate natural language description for a statement
 */
export function describeStatement(statement: Statement): string {
  const code = generateCode(statement);

  if (statement.type === "VariableDeclaration") {
    const decl = statement.declarations[0];
    if (decl && decl.id.type === "Identifier") {
      const name = decl.id.name;
      const initValue = extractInitValue(code);

      if (code.includes("newPage")) {
        return "新しいブラウザページ `" + name + "` を作成";
      } else if (code.includes("title")) {
        return "ページのタイトルを取得して `" + name + "` に保存";
      } else if (code.includes("textContent") || code.includes("innerHTML")) {
        return "要素のテキストを取得して `" + name + "` に保存";
      } else if (initValue) {
        return "`" + name + " = " + initValue + "` として準備";
      } else {
        return "`" + name + "` を準備";
      }
    }
  } else if (statement.type === "ExpressionStatement") {
    if (code.includes("goto")) {
      const url = extractStringValue(code);
      if (url) {
        return "ウェブページ `" + url + "` に移動";
      }
      return `指定されたURLに移動`;
    } else if (code.includes("click")) {
      return `要素をクリック`;
    } else if (code.includes("type") || code.includes("fill")) {
      return `テキストを入力`;
    } else if (code.includes("console.log")) {
      const logMatch = code.match(/console\.log\((.*)\)/);
      if (logMatch) {
        return "`console.log(" + logMatch[1] + ")` を出力";
      }
      return `コンソールに情報を出力`;
    } else if (code.includes(".push(")) {
      const pushMatch = code.match(/(\w+)\.push\((.*)\)/);
      if (pushMatch) {
        return "`" + pushMatch[1] + "` に `" + pushMatch[2] + "` を追加";
      }
      return `配列に要素を追加`;
    } else {
      const simplified = code.replace(/;$/, "").trim();
      if (simplified.length < 60) {
        return "`" + simplified + "` を実行";
      }
      return `処理を実行`;
    }
  } else if (statement.type === "ReturnStatement") {
    const returnMatch = code.match(/return\s*([\s\S]+?)(?:;?\s*)$/);
    if (returnMatch) {
      let returnValue = returnMatch[1].trim();
      if (returnValue.endsWith(";")) {
        returnValue = returnValue.slice(0, -1).trim();
      }
      returnValue = returnValue.replace(/\s+/g, " ");
      if (returnValue.length > 80) {
        returnValue = returnValue.substring(0, 77) + "...";
      }
      return "`" + returnValue + "` を返す";
    }
    return `実行結果を返却`;
  } else if (statement.type === "IfStatement") {
    return `条件を確認`;
  } else if (
    statement.type === "ForStatement" ||
    statement.type === "WhileStatement"
  ) {
    return `繰り返し処理`;
  } else if (statement.type === "TryStatement") {
    return `エラーハンドリング`;
  }

  return `処理を実行`;
}

/**
 * Generate natural language descriptions for a block of statements
 */
export function describeBlock(
  statements: Statement[],
  prefix: string = ""
): string[] {
  const descriptions: string[] = [];

  statements.forEach((stmt) => {
    const desc = describeStatement(stmt);
    descriptions.push(`${prefix}${desc}`);
  });

  return descriptions;
}
