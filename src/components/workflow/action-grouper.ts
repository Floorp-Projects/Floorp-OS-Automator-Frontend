import type {
  Statement,
  IfStatement,
  WhileStatement,
} from "@babel/types";
import i18n from "@/i18n/config";
import {
  describeCondition,
  generateCode,
  extractVariableName,
  extractStringValue,
} from "./code-descriptors";
import {
  isControlFlow,
  isDataExtractionAction,
  isInteractionAction,
  isNavigationAction,
  isReturnStatement,
} from "./action-classifiers";
import { generateHumanReadableDescription } from "./human-readable-generator";

export interface WorkflowAction {
  type:
    | "navigation"
    | "interaction"
    | "data-extraction"
    | "computation"
    | "control-flow"
    | "return";
  title: string;
  description: string;
  humanReadable: string; // 人間が読める詳細な説明
  statements: Statement[];
  importance: "high" | "medium" | "low";
  variables?: string[];
  icon?: string;
  details?: string[]; // ステップごとの自然言語説明
}

export function groupStatementsIntoActions(
  statements: Statement[]
): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  let i = 0;
  const variableMap = new Map<string, Statement[]>();

  // First pass: build variable dependency map
  statements.forEach((statement) => {
    const varName = extractVariableName(statement);

    if (varName) {
      variableMap.set(varName, [statement]);
    }
  });

  // Second pass: group statements into actions
  while (i < statements.length) {
    const statement = statements[i];
    const varName = extractVariableName(statement);

    // Return statement
    if (isReturnStatement(statement)) {
      const { readable, details } = generateHumanReadableDescription([
        statement,
      ]);
      actions.push({
        type: "return",
        title: i18n.t("workflowActions.return"),
        description: i18n.t("workflowActions.returnDescription"),
        humanReadable: readable || i18n.t("workflowActions.returnReadable"),
        statements: [statement],
        importance: "high",
        icon: "return",
        details,
      });
      i++;
      continue;
    }

    // Control flow (if, for, while, etc.)
    if (isControlFlow(statement)) {
      // 制御フローの詳細な説明を生成
      const { readable, details } = generateHumanReadableDescription([
        statement,
      ]);

      // タイトルと説明を動的に生成
      let title = i18n.t("workflowActions.controlFlow");
      let description = i18n.t("workflowActions.controlFlowDescription");

      if (statement.type === "IfStatement") {
        const ifStmt = statement as IfStatement;
        const condition = ifStmt.test ? generateCode(ifStmt.test) : "";
        const conditionDesc = describeCondition(condition);
        title = i18n.t("workflowActions.ifStatement");
        description = i18n.t("workflowActions.ifDescription", {
          condition: conditionDesc,
        });
      } else if (statement.type === "ForStatement") {
        title = i18n.t("workflowActions.forLoop");
        description = i18n.t("workflowActions.forDescription");
      } else if (statement.type === "WhileStatement") {
        const whileStmt = statement as WhileStatement;
        const condition = whileStmt.test ? generateCode(whileStmt.test) : "";
        const conditionDesc = describeCondition(condition);
        title = i18n.t("workflowActions.whileLoop");
        description = i18n.t("workflowActions.whileDescription", {
          condition: conditionDesc,
        });
      } else if (
        statement.type === "ForOfStatement" ||
        statement.type === "ForInStatement"
      ) {
        title = i18n.t("workflowActions.forOfLoop");
        description = i18n.t("workflowActions.forOfDescription");
      }

      actions.push({
        type: "control-flow",
        title,
        description,
        humanReadable:
          readable || i18n.t("workflowActions.controlFlowReadable"),
        statements: [statement],
        importance: "high",
        icon: "branch",
        details:
          details.length > 0
            ? details
            : [
                i18n.t("workflowActions.checkCondition"),
                i18n.t("workflowActions.executeAction"),
              ],
      });
      i++;
      continue;
    }

    // Check if this is a variable declaration that will be used for navigation/interaction
    if (varName) {
      const relatedStatements: Statement[] = [statement];
      let j = i + 1;

      // Look ahead for statements using this variable
      while (j < statements.length) {
        const nextStatement = statements[j];
        const nextCode = generateCode(nextStatement);

        // If the next statement uses this variable, group them
        if (nextCode.includes(varName)) {
          relatedStatements.push(nextStatement);
          j++;
        } else {
          break;
        }
      }

      // Determine action type based on related statements
      const combinedCode = relatedStatements
        .map((s) => generateCode(s))
        .join(" ");
      const { readable, details } =
        generateHumanReadableDescription(relatedStatements);

      if (isNavigationAction(combinedCode)) {
        const url = extractStringValue(combinedCode);
        actions.push({
          type: "navigation",
          title: i18n.t("workflowActions.navigation"),
          description: url
            ? i18n.t("workflowActions.navigationWithUrl", { url })
            : i18n.t("workflowActions.navigationDescription"),
          humanReadable:
            readable || i18n.t("workflowActions.navigationReadable"),
          statements: relatedStatements,
          importance: "high",
          variables: [varName],
          icon: "navigation",
          details,
        });
        i = j;
        continue;
      }

      if (isInteractionAction(combinedCode)) {
        actions.push({
          type: "interaction",
          title: i18n.t("workflowActions.interaction"),
          description: i18n.t("workflowActions.interactionDescription"),
          humanReadable:
            readable || i18n.t("workflowActions.interactionReadable"),
          statements: relatedStatements,
          importance: "high",
          variables: [varName],
          icon: "interaction",
          details,
        });
        i = j;
        continue;
      }

      if (isDataExtractionAction(combinedCode)) {
        actions.push({
          type: "data-extraction",
          title: i18n.t("workflowActions.dataExtraction"),
          description: i18n.t("workflowActions.dataExtractionDescription"),
          humanReadable:
            readable || i18n.t("workflowActions.dataExtractionReadable"),
          statements: relatedStatements,
          importance: "high",
          variables: [varName],
          icon: "extraction",
          details,
        });
        i = j;
        continue;
      }
    }

    // Standalone navigation action
    const code = generateCode(statement);
    if (isNavigationAction(code)) {
      const url = extractStringValue(code);
      const { readable, details } = generateHumanReadableDescription([
        statement,
      ]);
      actions.push({
        type: "navigation",
        title: i18n.t("workflowActions.navigation"),
        description: url
          ? i18n.t("workflowActions.navigationWithUrl", { url })
          : i18n.t("workflowActions.navigationReadable"),
        humanReadable: readable || i18n.t("workflowActions.navigationReadable"),
        statements: [statement],
        importance: "high",
        icon: "navigation",
        details,
      });
      i++;
      continue;
    }

    // Standalone interaction action
    if (isInteractionAction(code)) {
      const { readable, details } = generateHumanReadableDescription([
        statement,
      ]);
      actions.push({
        type: "interaction",
        title: i18n.t("workflowActions.interaction"),
        description: i18n.t("workflowActions.interactionDescription"),
        humanReadable:
          readable || i18n.t("workflowActions.interactionReadable"),
        statements: [statement],
        importance: "high",
        icon: "interaction",
        details,
      });
      i++;
      continue;
    }

    // Standalone data extraction
    if (isDataExtractionAction(code)) {
      const { readable, details } = generateHumanReadableDescription([
        statement,
      ]);
      actions.push({
        type: "data-extraction",
        title: i18n.t("workflowActions.dataExtraction"),
        description: i18n.t("workflowActions.dataExtractionDescription"),
        humanReadable:
          readable || i18n.t("workflowActions.dataExtractionReadable"),
        statements: [statement],
        importance: "medium",
        icon: "extraction",
        details,
      });
      i++;
      continue;
    }

    // Default: computation/variable assignment
    const { readable, details } = generateHumanReadableDescription([statement]);
    actions.push({
      type: "computation",
      title: varName
        ? i18n.t("workflowActions.prepareVariable")
        : i18n.t("workflowActions.computation"),
      description: varName
        ? i18n.t("workflowActions.prepareDescription", { name: varName })
        : i18n.t("workflowActions.computationDescription"),
      humanReadable: readable || i18n.t("workflowActions.computationReadable"),
      statements: [statement],
      importance: "low",
      variables: varName ? [varName] : undefined,
      icon: "compute",
      details,
    });
    i++;
  }

  return actions;
}
