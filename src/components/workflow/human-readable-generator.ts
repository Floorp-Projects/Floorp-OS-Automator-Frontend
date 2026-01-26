import type {
  Statement,
  IfStatement,
  ForStatement,
  WhileStatement,
  ForInStatement,
  ForOfStatement,
  TryStatement,
} from "@babel/types";
import { describeCondition, describeBlock, describeStatement, generateCode } from "./code-descriptors";

/**
 * Generate human-readable description from statements
 * Returns both a concise readable string and detailed step-by-step descriptions
 */
export function generateHumanReadableDescription(
  statements: Statement[]
): { readable: string; details: string[] } {
  const details: string[] = [];

  statements.forEach((statement) => {
    if (statement.type === "IfStatement") {
      // Handle if statements
      const ifStmt = statement as IfStatement;
      const condition = ifStmt.test ? generateCode(ifStmt.test) : "";
      const conditionDesc = describeCondition(condition);
      details.push(`もし${conditionDesc}なら：`);

      // then block
      if (ifStmt.consequent) {
        const consequentStatements =
          ifStmt.consequent.type === "BlockStatement"
            ? ifStmt.consequent.body
            : [ifStmt.consequent];
        const thenDescs = describeBlock(consequentStatements, "  [実行] ");
        details.push(...thenDescs);
      }

      // else block
      if (ifStmt.alternate) {
        if (ifStmt.alternate.type === "IfStatement") {
          details.push(`そうでなければ、次の条件を確認：`);
          const elseIfDescs = generateHumanReadableDescription([
            ifStmt.alternate,
          ]);
          details.push(...elseIfDescs.details.map((d) => `  ${d}`));
        } else {
          details.push(`そうでなければ：`);
          const alternateStatements =
            ifStmt.alternate.type === "BlockStatement"
              ? ifStmt.alternate.body
              : [ifStmt.alternate];
          const elseDescs = describeBlock(alternateStatements, "  [実行] ");
          details.push(...elseDescs);
        }
      }
    } else if (
      statement.type === "ForStatement" ||
      statement.type === "WhileStatement" ||
      statement.type === "ForInStatement" ||
      statement.type === "ForOfStatement"
    ) {
      // Handle loops
      let loopDesc = "繰り返し処理：";

      if (statement.type === "ForStatement") {
        const forStmt = statement as ForStatement;
        if (forStmt.init) {
          loopDesc = "指定回数繰り返す：";
        }
      } else if (statement.type === "WhileStatement") {
        const whileStmt = statement as WhileStatement;
        if (whileStmt.test) {
          const condition = generateCode(whileStmt.test);
          const conditionDesc = describeCondition(condition);
          loopDesc = `${conditionDesc}の間、繰り返す：`;
        }
      } else if (statement.type === "ForOfStatement") {
        loopDesc = "各要素に対して繰り返す：";
      } else if (statement.type === "ForInStatement") {
        loopDesc = "各プロパティに対して繰り返す：";
      }

      details.push(loopDesc);

      // Loop body
      const loopStmt = statement as
        | ForStatement
        | WhileStatement
        | ForInStatement
        | ForOfStatement;
      if (loopStmt.body) {
        const bodyStatements =
          loopStmt.body.type === "BlockStatement"
            ? loopStmt.body.body
            : [loopStmt.body];
        const bodyDescs = describeBlock(bodyStatements, "  [繰り返し] ");
        details.push(...bodyDescs);
      }
    } else if (statement.type === "TryStatement") {
      // Handle try-catch-finally
      const tryStmt = statement as TryStatement;
      details.push(`エラーが発生する可能性のある処理：`);

      // try block
      if (tryStmt.block) {
        const tryDescs = describeBlock(tryStmt.block.body, "  [処理] ");
        details.push(...tryDescs);
      }

      // catch block
      if (tryStmt.handler) {
        const errorVar =
          tryStmt.handler.param && tryStmt.handler.param.type === "Identifier"
            ? tryStmt.handler.param.name
            : "エラー";
        details.push(`もしエラーが発生したら（${errorVar}）：`);
        const catchDescs = describeBlock(
          tryStmt.handler.body.body,
          "  [警告] "
        );
        details.push(...catchDescs);
      }

      // finally block
      if (tryStmt.finalizer) {
        details.push(`最後に必ず実行：`);
        const finallyDescs = describeBlock(tryStmt.finalizer.body, "  [実行] ");
        details.push(...finallyDescs);
      }
    } else if (statement.type === "ReturnStatement") {
      // Handle return statements
      const desc = describeStatement(statement);
      details.push(desc);
    } else {
      // Handle other statements
      const desc = describeStatement(statement);
      details.push(desc);
    }
  });

  const readable = details.join(" → ");
  return { readable, details };
}
