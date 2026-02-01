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
 * Floorpブラウザ自動化プラグインを作成
 */
function createFloorpPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.floorp.browser",
    packageName: "Floorp ブラウザ自動化",
    packageVersion: "1.0.0",
    description:
      "Floorpブラウザのタブ操作、フォーム入力、DOM操作を行う内蔵プラグイン",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "createTab",
        functionName: "タブ作成",
        description: "新しいタブを開いてURLにナビゲート",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "url",
              type: "string",
              description: "開くURL",
            }),
            create(FunctionParameterSchema, {
              name: "waitForLoad",
              type: "boolean",
              description: "ページ読み込み完了を待つか",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "作成されたタブのID",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "タブ操作",
            description: "ブラウザタブを操作する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/tabs"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "tabWaitForElement",
        functionName: "要素待機",
        description: "指定したセレクタの要素が表示されるまで待機",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
            create(FunctionParameterSchema, {
              name: "selector",
              type: "string",
              description: "CSSセレクタ",
            }),
            create(FunctionParameterSchema, {
              name: "timeout",
              type: "number",
              description: "タイムアウト (ms)",
            }),
          ],
          returns: [],
        }),
        permissions: [],
      }),
      create(PluginFunctionSchema, {
        functionId: "tabInput",
        functionName: "フォーム入力",
        description: "指定した入力フィールドにテキストを入力",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
            create(FunctionParameterSchema, {
              name: "selector",
              type: "string",
              description: "CSSセレクタ",
            }),
            create(FunctionParameterSchema, {
              name: "value",
              type: "string",
              description: "入力するテキスト",
            }),
          ],
          returns: [],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "フォーム入力",
            description: "フォームフィールドにデータを入力する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/forms"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "tabGetElements",
        functionName: "要素取得",
        description: "セレクタに一致する全要素のHTMLを取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
            create(FunctionParameterSchema, {
              name: "selector",
              type: "string",
              description: "CSSセレクタ",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "elements",
              type: "array",
              description: "要素のHTML配列 (JSON)",
            }),
          ],
        }),
        permissions: [],
      }),
      create(PluginFunctionSchema, {
        functionId: "tabClick",
        functionName: "クリック",
        description: "指定した要素をクリック",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
            create(FunctionParameterSchema, {
              name: "selector",
              type: "string",
              description: "CSSセレクタ",
            }),
          ],
          returns: [],
        }),
        permissions: [],
      }),
      create(PluginFunctionSchema, {
        functionId: "destroyTabInstance",
        functionName: "インスタンス解放",
        description: "タブの制御インスタンスを解放（ユーザーに操作を返す）",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
          ],
          returns: [],
        }),
        permissions: [],
      }),
    ],
  });
}

/**
 * Thunderbird連携プラグインを作成
 */
function createThunderbirdPlugin() {
  return create(PluginPackageSchema, {
    packageId: "sapphillon.thunderbird",
    packageName: "Thunderbird 連携",
    packageVersion: "1.0.0",
    description:
      "Thunderbirdからユーザー情報やカレンダー予定を取得するプラグイン",
    pluginStoreUrl: "https://plugins.sapphillon.com/sapphillon/thunderbird",
    verified: true,
    internalPlugin: false,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "getIdentity",
        functionName: "ユーザー情報取得",
        description:
          "Thunderbirdのデフォルトアカウントから名前とメールアドレスを取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [],
          returns: [
            create(FunctionParameterSchema, {
              name: "name",
              type: "string",
              description: "ユーザー名",
            }),
            create(FunctionParameterSchema, {
              name: "email",
              type: "string",
              description: "メールアドレス",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "Thunderbird アクセス",
            description: "Thunderbirdのユーザー情報にアクセスする権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["thunderbird/identity"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "getCalendarEvents",
        functionName: "カレンダー取得",
        description: "Thunderbirdカレンダーから指定日数分の予定を取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "days",
              type: "number",
              description: "取得する日数",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "events",
              type: "array",
              description: "カレンダー予定の配列",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "カレンダー読み取り",
            description: "Thunderbirdカレンダーの予定を読み取る権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["thunderbird/calendar"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      create(PluginFunctionSchema, {
        functionId: "activateThunderbird",
        functionName: "Thunderbird起動",
        description: "Thunderbirdアプリをフォアグラウンドに表示",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [],
          returns: [],
        }),
        permissions: [],
      }),
      create(PluginFunctionSchema, {
        functionId: "showCalendarView",
        functionName: "カレンダー表示",
        description: "Thunderbirdのカレンダービューを表示",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [],
          returns: [],
        }),
        permissions: [],
      }),
    ],
  });
}

/**
 * INIAD AI MOPプラグインを作成
 */
function createIniadAiMopPlugin() {
  return create(PluginPackageSchema, {
    packageId: "iniad.ai.mop",
    packageName: "INIAD AI MOP",
    packageVersion: "1.0.0",
    description: "INIAD AI MOP APIを使用してAIチャット機能を提供するプラグイン",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      create(PluginFunctionSchema, {
        functionId: "chat",
        functionName: "AIチャット",
        description: "AIモデルにプロンプトを送信して応答を取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "systemPrompt",
              type: "string",
              description: "システムプロンプト（AIの役割設定）",
            }),
            create(FunctionParameterSchema, {
              name: "userPrompt",
              type: "string",
              description: "ユーザーからの質問やリクエスト",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "response",
              type: "string",
              description: "AIからの応答",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "AI API アクセス",
            description: "AI APIにリクエストを送信する権限",
            permissionType: PermissionType.NET_ACCESS,
            resource: ["ai/chat"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * 利用可能なモックプラグインを作成
 * デモワークフロー (workflow.js) で使用されるプラグインを定義
 */
export function getMockPlugins() {
  return [
    createFloorpPlugin(),
    createThunderbirdPlugin(),
    createIniadAiMopPlugin(),
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

    // Floorp ブラウザ自動化プラグイン
    if (
      code.includes("floorp") ||
      code.includes("createtab") ||
      code.includes("tabinput") ||
      code.includes("tabclick") ||
      code.includes("tabgetelements") ||
      code.includes("tabwaitforelement")
    ) {
      selectedPlugins.push(mockPlugins[0]); // Floorp
    }

    // Thunderbird 連携プラグイン
    if (
      code.includes("thunderbird") ||
      code.includes("getidentity") ||
      code.includes("getcalendarevents")
    ) {
      selectedPlugins.push(mockPlugins[1]); // Thunderbird
    }

    // INIAD AI MOP プラグイン
    if (
      code.includes("iniad_ai_mop") ||
      code.includes("ai.chat") ||
      code.includes(".chat(")
    ) {
      selectedPlugins.push(mockPlugins[2]); // INIAD AI MOP
    }

    // 何も一致しない場合は、Floorpプラグインをデフォルトとして追加
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
