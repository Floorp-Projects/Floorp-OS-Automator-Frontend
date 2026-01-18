/**
 * @fileoverview ワークフローで使用されるプラグイン関数を表示するコンポーネント
 *
 * @module components/workflow/WorkflowFunctionList
 */

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import React from "react";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import type {
    PluginFunction,
    PluginPackage,
} from "@/gen/sapphillon/v1/plugin_pb";
import { PermissionLevel } from "@/gen/sapphillon/v1/permission_pb";
import {
    LuAppWindow,
    LuDatabase,
    LuFileSpreadsheet,
    LuFileText,
    LuGlobe,
    LuMail,
    LuMessageSquare,
    LuPlus,
    LuShield,
    LuTerminal,
    LuTriangleAlert,
    LuZap,
} from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";

interface WorkflowFunctionListProps {
    /** 表示するワークフロー定義 */
    workflow: Workflow;
    /** コンパクト表示（アイコンのみ） */
    compact?: boolean;
}

/**
 * 関数IDからアイコンを取得
 */
const getFunctionIcon = (functionId: string, size = 14) => {
    // 関数名の最後の部分を取得 (e.g., "app.sapphillon.core.excel.createWorkbook" -> "createworkbook")
    const parts = functionId.split(".");
    const funcName = (parts[parts.length - 1] || functionId).toLowerCase();

    // 具体的なアクションを先にチェック
    if (funcName.includes("read")) {
        return <LuFileText size={size} />;
    }
    if (funcName.includes("write")) {
        return <LuFileText size={size} />;
    }
    if (
        funcName.includes("create") || funcName.includes("add") ||
        funcName.includes("new")
    ) {
        return <LuPlus size={size} />;
    }
    if (funcName.includes("open") || funcName.includes("launch")) {
        return <LuAppWindow size={size} />;
    }
    if (
        funcName.includes("get") || funcName.includes("list") ||
        funcName.includes("fetch")
    ) {
        return <LuDatabase size={size} />;
    }
    if (funcName.includes("email") || funcName.includes("mail")) {
        return <LuMail size={size} />;
    }
    if (
        funcName.includes("slack") || funcName.includes("message") ||
        funcName.includes("notify")
    ) {
        return <LuMessageSquare size={size} />;
    }
    if (
        funcName.includes("exec") || funcName.includes("shell") ||
        funcName.includes("command")
    ) {
        return <LuTerminal size={size} />;
    }
    if (funcName.includes("http") || funcName.includes("request")) {
        return <LuGlobe size={size} />;
    }

    // パッケージ名でフォールバック
    const id = functionId.toLowerCase();
    if (id.includes("excel") || id.includes("spreadsheet")) {
        return <LuFileSpreadsheet size={size} />;
    }

    return <LuZap size={size} />;
};

/**
 * パーミッションレベルから色を取得
 */
const getLevelColor = (level?: PermissionLevel): string => {
    switch (level) {
        case PermissionLevel.CRITICAL:
            return "red";
        case PermissionLevel.HIGH:
            return "orange";
        case PermissionLevel.MEDIUM:
            return "yellow";
        default:
            return "gray";
    }
};

/**
 * パーミッションレベルのラベルを取得
 */
const getLevelLabel = (level?: PermissionLevel): string => {
    switch (level) {
        case PermissionLevel.CRITICAL:
            return "CRITICAL";
        case PermissionLevel.HIGH:
            return "HIGH";
        case PermissionLevel.MEDIUM:
            return "MEDIUM";
        default:
            return "UNKNOWN";
    }
};

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
function extractFunctionInfo(workflow: Workflow): FunctionInfo[] {
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
function categorizeFunctions(functions: FunctionInfo[]): CategorizedFunctions {
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
 * ワークフローで使用されるプラグイン関数を表示
 */
export const WorkflowFunctionList: React.FC<WorkflowFunctionListProps> = ({
    workflow,
    compact = false,
}) => {
    const functions = extractFunctionInfo(workflow);
    const { highRisk, normal } = categorizeFunctions(functions);

    if (functions.length === 0) {
        return (
            <Text fontSize="xs" color="fg.muted">
                プラグイン関数なし
            </Text>
        );
    }

    if (compact) {
        // コンパクト表示: アイコンのみの横並び
        return (
            <HStack gap={1} flexWrap="wrap">
                {functions.map((func) => {
                    const colorScheme = getLevelColor(func.permissionLevel);
                    const isHighRisk =
                        func.permissionLevel === PermissionLevel.HIGH ||
                        func.permissionLevel === PermissionLevel.CRITICAL;

                    return (
                        <Tooltip
                            key={func.functionId}
                            content={
                                <VStack align="start" gap={1} p={1}>
                                    <Text fontWeight="bold" fontSize="xs">
                                        {func.functionName}
                                    </Text>
                                    {func.description && (
                                        <Text fontSize="xs" opacity={0.8}>
                                            {func.description}
                                        </Text>
                                    )}
                                </VStack>
                            }
                            showArrow
                            openDelay={200}
                        >
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                w="24px"
                                h="24px"
                                rounded="md"
                                bg={`${colorScheme}.100`}
                                color={`${colorScheme}.600`}
                                _dark={{
                                    bg: `${colorScheme}.900`,
                                    color: `${colorScheme}.300`,
                                }}
                                cursor="help"
                                position="relative"
                            >
                                {getFunctionIcon(func.functionId, 12)}
                                {isHighRisk && (
                                    <Box
                                        position="absolute"
                                        top="-2px"
                                        right="-2px"
                                        color="red.500"
                                    >
                                        <LuTriangleAlert size={8} />
                                    </Box>
                                )}
                            </Box>
                        </Tooltip>
                    );
                })}
            </HStack>
        );
    }

    // 単一の関数カードをレンダリングするヘルパー
    const renderFunctionCard = (
        func: FunctionInfo,
        index: number,
        showStepNumber: boolean = true,
    ) => {
        const colorScheme = getLevelColor(func.permissionLevel);
        const isHighRisk = func.permissionLevel === PermissionLevel.HIGH ||
            func.permissionLevel === PermissionLevel.CRITICAL;

        const tooltipContent = (
            <VStack align="start" gap={1} p={1} maxW="240px">
                <HStack>
                    <Text fontWeight="bold" fontSize="sm">
                        {func.functionName}
                    </Text>
                    {func.packageName && (
                        <Badge
                            size="xs"
                            variant="outline"
                            colorScheme="gray"
                            color="gray.200"
                            borderColor="gray.500"
                        >
                            {func.packageName}
                        </Badge>
                    )}
                </HStack>
                <Text fontSize="xs" color="gray.100">
                    {func.description || "説明なし"}
                </Text>
                <HStack mt={1}>
                    <Badge
                        colorScheme={colorScheme}
                        variant="subtle"
                        size="sm"
                        px={2}
                    >
                        Risk: {getLevelLabel(func.permissionLevel)}
                    </Badge>
                </HStack>
            </VStack>
        );

        return (
            <Tooltip
                key={func.functionId}
                content={tooltipContent}
                showArrow
                openDelay={300}
                contentProps={{
                    bg: "gray.800",
                    color: "white",
                    _dark: { bg: "gray.700" },
                    zIndex: 10000,
                }}
                disabled={false}
            >
                <Box position="relative">
                    <Box
                        p={1.5}
                        rounded="md"
                        bg={`${colorScheme}.50`}
                        _dark={{
                            bg: `${colorScheme}.950`,
                            borderColor: isHighRisk
                                ? "red.600"
                                : `${colorScheme}.800`,
                        }}
                        borderWidth="1px"
                        borderColor={isHighRisk
                            ? "red.400"
                            : `${colorScheme}.200`}
                        cursor="help"
                        transition="all 0.1s"
                        _hover={{
                            boxShadow: "sm",
                        }}
                        position="relative"
                        display="flex"
                        alignItems="center"
                        zIndex={1}
                    >
                        {/* ステップ番号 */}
                        {showStepNumber && (
                            <Box
                                position="absolute"
                                top={0.5}
                                left={1}
                                fontSize="8px"
                                fontWeight="bold"
                                color={`${colorScheme}.700`}
                                _dark={{ color: `${colorScheme}.300` }}
                                opacity={0.5}
                                lineHeight={1}
                            >
                                {index + 1}
                            </Box>
                        )}

                        {/* 高リスク警告アイコン */}
                        {isHighRisk && (
                            <Box
                                position="absolute"
                                top={0.5}
                                right={0.5}
                                color="red.500"
                            >
                                <LuTriangleAlert size={8} />
                            </Box>
                        )}

                        {/* アイコン */}
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            w="24px"
                            h="24px"
                            minW="24px"
                            rounded="full"
                            bg={`${colorScheme}.100`}
                            color={`${colorScheme}.600`}
                            _dark={{
                                bg: `${colorScheme}.800`,
                                color: `${colorScheme}.200`,
                            }}
                            mr={2}
                        >
                            {getFunctionIcon(func.functionId, 12)}
                        </Box>

                        {/* 関数名 */}
                        <Text
                            fontSize="xs"
                            fontWeight="medium"
                            textAlign="left"
                            lineClamp={1}
                            flex={1}
                        >
                            {func.functionName}
                        </Text>
                    </Box>
                </Box>
            </Tooltip>
        );
    };

    // 通常表示: 高リスクと通常に分けて表示
    return (
        <VStack align="stretch" gap={2}>
            {/* 高リスク操作セクション */}
            {highRisk.length > 0 && (
                <Box
                    p={2}
                    rounded="md"
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.300"
                    _dark={{
                        bg: "red.950/50",
                        borderColor: "red.700",
                    }}
                >
                    <HStack gap={1.5} mb={2}>
                        <Box color="red.500">
                            <LuTriangleAlert size={12} />
                        </Box>
                        <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="red.700"
                            _dark={{ color: "red.300" }}
                        >
                            高リスク ({highRisk.length})
                        </Text>
                    </HStack>
                    <Box
                        display="grid"
                        gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))"
                        gap={1.5}
                    >
                        {highRisk.map((func) => {
                            const originalIndex = functions.findIndex(
                                (f) => f.functionId === func.functionId,
                            );
                            return renderFunctionCard(
                                func,
                                originalIndex,
                                true,
                            );
                        })}
                    </Box>
                </Box>
            )}

            {/* 通常操作セクション */}
            {normal.length > 0 && (
                <Box>
                    {highRisk.length > 0 && (
                        <HStack gap={1.5} mb={1.5}>
                            <Box color="fg.muted">
                                <LuShield size={10} />
                            </Box>
                            <Text
                                fontSize="2xs"
                                fontWeight="medium"
                                color="fg.muted"
                            >
                                その他 ({normal.length})
                            </Text>
                        </HStack>
                    )}
                    <Box
                        display="grid"
                        gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))"
                        gap={1.5}
                    >
                        {normal.map((func) => {
                            const originalIndex = functions.findIndex(
                                (f) => f.functionId === func.functionId,
                            );
                            return renderFunctionCard(
                                func,
                                originalIndex,
                                true,
                            );
                        })}
                    </Box>
                </Box>
            )}
        </VStack>
    );
};

export default WorkflowFunctionList;
