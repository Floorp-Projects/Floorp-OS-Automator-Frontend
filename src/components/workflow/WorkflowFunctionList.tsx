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
 * ワークフローで使用されるプラグイン関数を表示
 */
export const WorkflowFunctionList: React.FC<WorkflowFunctionListProps> = ({
    workflow,
    compact = false,
}) => {
    const functions = extractFunctionInfo(workflow);

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

    // 通常表示: Grid レイアウトで均一なカード
    return (
        <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
            gap={2}
        >
            {functions.map((func, index) => {
                const colorScheme = getLevelColor(func.permissionLevel);
                const isHighRisk =
                    func.permissionLevel === PermissionLevel.HIGH ||
                    func.permissionLevel === PermissionLevel.CRITICAL;

                const isLast = index === functions.length - 1;

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
                                p={2}
                                rounded="lg"
                                bg={`${colorScheme}.50`}
                                _dark={{
                                    bg: `${colorScheme}.950`,
                                    borderColor: isHighRisk
                                        ? "red.600"
                                        : `${colorScheme}.800`,
                                }}
                                borderWidth={isHighRisk ? "2px" : "1px"}
                                borderColor={isHighRisk
                                    ? "red.400"
                                    : `${colorScheme}.200`}
                                cursor="help"
                                transition="all 0.15s"
                                _hover={{
                                    transform: "translateY(-1px)",
                                    boxShadow: "sm",
                                }}
                                position="relative"
                                display="flex"
                                alignItems="center"
                                zIndex={1}
                            >
                                {/* ステップ番号 */}
                                <Box
                                    position="absolute"
                                    top={1}
                                    left={1.5}
                                    fontSize="9px"
                                    fontWeight="bold"
                                    color={`${colorScheme}.700`}
                                    _dark={{ color: `${colorScheme}.300` }}
                                    opacity={0.5}
                                    lineHeight={1}
                                >
                                    {index + 1}
                                </Box>

                                {/* 高リスクバッジ */}
                                {isHighRisk && (
                                    <Box
                                        position="absolute"
                                        top={1}
                                        right={1}
                                        color="red.500"
                                    >
                                        <LuShield size={12} />
                                    </Box>
                                )}

                                {/* アイコン */}
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    w="32px"
                                    h="32px"
                                    minW="32px"
                                    rounded="full"
                                    bg={`${colorScheme}.100`}
                                    color={`${colorScheme}.600`}
                                    _dark={{
                                        bg: `${colorScheme}.800`,
                                        color: `${colorScheme}.200`,
                                    }}
                                    mr={3}
                                    ml={1}
                                >
                                    {getFunctionIcon(func.functionId, 16)}
                                </Box>

                                {/* 関数名 */}
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    textAlign="left"
                                    lineClamp={1}
                                    flex={1}
                                >
                                    {func.functionName}
                                </Text>
                            </Box>

                            {/* コネクタ（実行順序を示す棒） */}
                            {!isLast && (
                                <Box
                                    position="absolute"
                                    right="-12px"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    width="16px"
                                    height="2px"
                                    bg="gray.300"
                                    _dark={{ bg: "gray.600" }}
                                    zIndex={0}
                                />
                            )}
                        </Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
};

export default WorkflowFunctionList;
