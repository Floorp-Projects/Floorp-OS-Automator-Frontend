/**
 * @fileoverview ワークフローのモックデータ生成ユーティリティ
 *
 * 本番環境でもバックエンドから十分なデータが返ってこない場合に、
 * デモ用にモックデータを提供するためのユーティリティです。
 *
 * @module lib/mock-workflow-data
 */

import { create } from "@bufbuild/protobuf";
import type { Workflow } from "@/gen/sapphillon/v1/workflow_pb";
import {
  PluginPackageSchema,
  PluginFunctionSchema,
  FunctionDefineSchema,
  FunctionParameterSchema,
} from "@/gen/sapphillon/v1/plugin_pb";
import {
  PermissionSchema,
  PermissionType,
  PermissionLevel,
} from "@/gen/sapphillon/v1/permission_pb";

/**
 * タイムスタンプを作成するヘルパー関数
 */
function createTimestamp(): { seconds: bigint; nanos: number } {
  return {
    seconds: BigInt(Math.floor(Date.now() / 1000)),
    nanos: 0,
  };
}

/**
 * 通知プラグインを作成
 */
function createNotificationPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.sapphillon.notifications",
    packageName: "通知プラグイン",
    packageVersion: "1.2.0",
    description: "メールやSlackなどの通知を送信するプラグイン",
    pluginStoreUrl: "https://plugins.sapphillon.com/com.sapphillon.notifications",
    verified: true,
    internalPlugin: false,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "send_email",
        functionName: "メール送信",
        description: "メールを送信します",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "to",
              type: "string",
              description: "送信先メールアドレス",
            }),
            create(FunctionParameterSchema, {
              name: "subject",
              type: "string",
              description: "メール件名",
            }),
            create(FunctionParameterSchema, {
              name: "body",
              type: "string",
              description: "メール本文",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "success",
              type: "boolean",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "messageId",
              type: "string",
              description: "",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "メール送信",
            description: "メールを送信する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["notifications/email"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "send_slack",
        functionName: "Slack通知",
        description: "Slackチャンネルにメッセージを送信します",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "channel",
              type: "string",
              description: "Slackチャンネル名",
            }),
            create(FunctionParameterSchema, {
              name: "message",
              type: "string",
              description: "送信メッセージ",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "success",
              type: "boolean",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "ts",
              type: "string",
              description: "メッセージタイムスタンプ",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "Slack通知",
            description: "Slackにメッセージを送信する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["notifications/slack"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * ファイルシステムプラグインを作成
 */
function createFilesystemPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.sapphillon.filesystem",
    packageName: "ファイルシステム",
    packageVersion: "2.0.1",
    description: "ファイルの読み書きや操作を行うプラグイン",
    pluginStoreUrl: "https://plugins.sapphillon.com/com.sapphillon.filesystem",
    verified: true,
    internalPlugin: false,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "read_file",
        functionName: "ファイル読み込み",
        description: "ファイルを読み込みます",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "path",
              type: "string",
              description: "ファイルパス",
            }),
            create(FunctionParameterSchema, {
              name: "encoding",
              type: "string",
              description: "エンコーディング (default: utf-8)",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "content",
              type: "string",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "size",
              type: "number",
              description: "",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ファイル読み込み",
            description: "ファイルを読み込む権限",
            permissionType: PermissionType.FILESYSTEM_READ,
            resource: [],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "write_file",
        functionName: "ファイル書き込み",
        description: "ファイルに書き込みます",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "path",
              type: "string",
              description: "ファイルパス",
            }),
            create(FunctionParameterSchema, {
              name: "content",
              type: "string",
              description: "書き込む内容",
            }),
            create(FunctionParameterSchema, {
              name: "encoding",
              type: "string",
              description: "エンコーディング (default: utf-8)",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "success",
              type: "boolean",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "bytesWritten",
              type: "number",
              description: "",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ファイル書き込み",
            description: "ファイルに書き込む権限",
            permissionType: PermissionType.FILESYSTEM_WRITE,
            resource: [],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
    ],
  });
}

/**
 * HTTPリクエストプラグインを作成
 */
function createHttpPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.sapphillon.http",
    packageName: "HTTPクライアント",
    packageVersion: "1.5.0",
    description: "HTTPリクエストを送信するプラグイン",
    pluginStoreUrl: "https://plugins.sapphillon.com/com.sapphillon.http",
    verified: true,
    internalPlugin: false,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "fetch",
        functionName: "HTTPリクエスト",
        description: "HTTPリクエストを送信します",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "url",
              type: "string",
              description: "リクエストURL",
            }),
            create(FunctionParameterSchema, {
              name: "method",
              type: "string",
              description: "HTTPメソッド (default: GET)",
            }),
            create(FunctionParameterSchema, {
              name: "headers",
              type: "object",
              description: "リクエストヘッダー",
            }),
            create(FunctionParameterSchema, {
              name: "body",
              type: "string",
              description: "リクエストボディ",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "status",
              type: "number",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "statusText",
              type: "string",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "headers",
              type: "object",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "body",
              type: "string",
              description: "",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ネットワークアクセス",
            description: "ネットワークリクエストを送信する権限",
            permissionType: PermissionType.NET_ACCESS,
            resource: [],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * データベースプラグインを作成
 */
function createDatabasePlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.sapphillon.database",
    packageName: "データベース",
    packageVersion: "1.0.0",
    description: "データベースクエリを実行するプラグイン",
    pluginStoreUrl: "https://plugins.sapphillon.com/com.sapphillon.database",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "query",
        functionName: "データベースクエリ",
        description: "SQLクエリを実行します",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "sql",
              type: "string",
              description: "SQLクエリ",
            }),
            create(FunctionParameterSchema, {
              name: "params",
              type: "array",
              description: "パラメータ",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "rows",
              type: "array",
              description: "",
            }),
            create(FunctionParameterSchema, {
              name: "rowCount",
              type: "number",
              description: "",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "データベース読み込み",
            description: "データベースからデータを読み込む権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["database"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
    ],
  });
}

/**
 * 利用可能なモックプラグインを作成
 */
export function getMockPlugins() {
  return [
    createNotificationPlugin(),
    createFilesystemPlugin(),
    createHttpPlugin(),
    createDatabasePlugin(),
  ];
}

/**
 * ワークフローにモックのプラグインデータを追加する
 *
 * バックエンドから返されたワークフローにpluginPackagesが含まれていない場合、
 * デモ用にモックデータを追加します。
 *
 * @param workflow - バックエンドから返されたワークフロー
 * @returns プラグインデータが追加されたワークフロー
 */
export function enhanceWorkflowWithMockData(workflow: Workflow): Workflow {
  // 最初のコードリビジョンを取得
  const firstCode = workflow.workflowCode?.[0];

  if (!firstCode) {
    return workflow;
  }

  // pluginPackagesが空の場合のみモックデータを追加
  if (!firstCode.pluginPackages || firstCode.pluginPackages.length === 0) {
    const mockPlugins = getMockPlugins();

    // コード内で使用されている関数を推測して適切なプラグインを選択
    const code = firstCode.code.toLowerCase();
    const selectedPlugins: typeof mockPlugins = [];

    if (code.includes("email") || code.includes("mail") || code.includes("send")) {
      selectedPlugins.push(mockPlugins[0]); // 通知プラグイン
    }
    if (code.includes("file") || code.includes("read") || code.includes("write")) {
      selectedPlugins.push(mockPlugins[1]); // ファイルシステムプラグイン
    }
    if (code.includes("http") || code.includes("fetch") || code.includes("request")) {
      selectedPlugins.push(mockPlugins[2]); // HTTPプラグイン
    }
    if (code.includes("database") || code.includes("sql") || code.includes("query")) {
      selectedPlugins.push(mockPlugins[3]); // データベースプラグイン
    }

    // 何も一致しない場合は、通知プラグインをデフォルトとして追加
    if (selectedPlugins.length === 0) {
      selectedPlugins.push(mockPlugins[0]);
    }

    // 選択したプラグインから関数IDを抽出
    const functionIds: string[] = [];
    selectedPlugins.forEach((plugin) => {
      plugin.functions?.forEach((func) => {
        functionIds.push(func.functionId);
      });
    });

    // 新しいコードリビジョンを作成
    const enhancedCode = {
      ...firstCode,
      pluginPackages: selectedPlugins,
      pluginFunctionIds: functionIds,
    };

    // ワークフローの新しい配列を作成
    const enhancedWorkflowCode = [
      enhancedCode,
      ...(workflow.workflowCode?.slice(1) || []),
    ];

    // 新しいワークフローオブジェクトを作成
    return {
      ...workflow,
      workflowCode: enhancedWorkflowCode,
    };
  }

  return workflow;
}
