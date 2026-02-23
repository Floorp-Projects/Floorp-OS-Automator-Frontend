/**
 * @fileoverview ワークフローユーティリティ関数
 *
 * @module components/workflow/workflow-utils
 */

import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import type {
    PluginFunction,
    PluginPackage,
} from "@/gen/sapphillon/v1/plugin_pb";
import { PermissionLevel } from "@/gen/sapphillon/v1/permission_pb";

interface FunctionInfo {
    functionId: string;
    functionName: string;
    description: string;
    permissionLevel: PermissionLevel;
    packageName?: string;
}

/**
 * ワークフローから使用される関数情報を抽出
 */
export function extractFunctionInfo(workflow: Workflow): FunctionInfo[] {
    const latestCode = workflow.workflowCode[workflow.workflowCode.length - 1];
    if (!latestCode) return [];

    const functionIds = latestCode.pluginFunctionIds || [];
    const packages = latestCode.pluginPackages || [];

    // プラグインパッケージから関数情報をマッピング
    const functionMap = new Map<
        string,
        { func: PluginFunction; pkg: PluginPackage }
    >();
    for (const pkg of packages) {
        for (const func of pkg.functions) {
            functionMap.set(func.functionId, { func, pkg });
        }
    }

    return functionIds.map((functionId) => {
        const info = functionMap.get(functionId);
        if (info) {
            // 最も高いパーミッションレベルを取得
            const maxLevel = info.func.permissions.reduce((max, p) => {
                return (p.permissionLevel || 0) > max
                    ? (p.permissionLevel || 0)
                    : max;
            }, 0 as PermissionLevel);

            return {
                functionId,
                functionName: info.func.functionName,
                description: info.func.description,
                permissionLevel: maxLevel,
                packageName: info.pkg.packageName,
            };
        }
        // プラグイン情報がない場合はIDから推測
        return {
            functionId,
            functionName: functionId.replace(/_/g, " "),
            description: "",
            permissionLevel: PermissionLevel.UNSPECIFIED,
        };
    });
}

/**
 * リスクレベル別に分類された関数情報
 */
interface CategorizedFunctions {
    highRisk: FunctionInfo[];
    normal: FunctionInfo[];
}

/**
 * 関数をリスクレベル別に分類
 */
export function categorizeFunctions(functions: FunctionInfo[]): CategorizedFunctions {
    const highRisk: FunctionInfo[] = [];
    const normal: FunctionInfo[] = [];

    functions.forEach((func) => {
        if (
            func.permissionLevel === PermissionLevel.HIGH ||
            func.permissionLevel === PermissionLevel.CRITICAL
        ) {
            highRisk.push(func);
        } else {
            normal.push(func);
        }
    });

    return { highRisk, normal };
}

/**
 * ワークフローに高リスク関数が含まれるかチェック
 */
export function hasHighRiskFunctions(workflow: Workflow): boolean {
    const functions = extractFunctionInfo(workflow);
    const { highRisk } = categorizeFunctions(functions);
    return highRisk.length > 0;
}

export type { FunctionInfo };

