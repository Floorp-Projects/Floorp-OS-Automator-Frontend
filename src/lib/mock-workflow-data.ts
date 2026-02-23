/**
 * @fileoverview ワークフローのモックデータ生成ユーティリティ
 *
 * 本番環境でもバックエンドから十分なデータが返ってこない場合に、
 * デモ用にモックデータを提供するためのユーティリティです。
 *
 * このモックデータは demo_workflows/workflow.js (Subscription Optimization Deep Research) で
 * 実際に使用されているプラグインと関数を正確に反映しています。
 *
 * @module lib/mock-workflow-data
 *
 * ============================================================================
 * 使用プラグイン一覧 (workflow.js 解析結果)
 * ============================================================================
 *
 * 1. floorp (com.floorp.browser) - ブラウザ自動化
 *    - createTab, closeTab, attachToTab, browserTabs
 *    - tabWaitForElement, tabWaitForNetworkIdle
 *    - tabElementText, tabAttribute, tabClick
 *
 * 2. llm_chat - LLMチャット
 *    - chat(systemPrompt, userPrompt)
 *
 * 3. app.sapphillon.core.exec - コマンド実行
 *    - exec(cmd)
 *
 * 4. app.sapphillon.core.filesystem - ファイルシステム操作
 *    - write(path, content)
 *
 * 5. ocr (オプション) - PDF請求書テキスト抽出
 *    - extract_text(filePath)
 * ============================================================================
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
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されている関数:
 * - floorp.browserTabs() - 全タブ取得
 * - floorp.createTab(url, waitForLoad) - タブ作成
 * - floorp.closeTab(tabId) - タブを閉じる
 * - floorp.attachToTab(tabId) - タブにアタッチ
 * - floorp.tabWaitForElement(tabId, selector, timeout) - 要素待機
 * - floorp.tabWaitForNetworkIdle(tabId) - ネットワーク待機
 * - floorp.tabElementText(tabId, selector) - テキスト取得
 * - floorp.tabAttribute(tabId, selector, attribute) - 属性取得
 * - floorp.tabClick(tabId, selector) - クリック
 */
function createFloorpPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.floorp.browser",
    packageName: "Floorp",
    packageVersion: "1.0.0",
    description:
      "Floorpブラウザのタブ操作、スクレイピング、DOM操作を行う内蔵プラグイン（Subscription Optimization対応）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // browserTabs - workflow.js: floorp.browserTabs()
      create(PluginFunctionSchema, {
        functionId: "browserTabs",
        functionName: "全タブ取得",
        description: "現在開いている全タブの情報を取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [],
          returns: [
            create(FunctionParameterSchema, {
              name: "tabs",
              type: "array",
              description: "タブ情報の配列 (JSON形式)",
            }),
          ],
        }),
        permissions: [],
      }),
      // createTab - workflow.js: floorp.createTab(url, false)
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
      // closeTab - workflow.js: floorp.closeTab(tabId)
      create(PluginFunctionSchema, {
        functionId: "closeTab",
        functionName: "タブを閉じる",
        description: "指定したタブを閉じる",
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
      // attachToTab - workflow.js: floorp.attachToTab(tabId)
      create(PluginFunctionSchema, {
        functionId: "attachToTab",
        functionName: "タブにアタッチ",
        description: "既存のタブに制御をアタッチ",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "tabId",
              type: "string",
              description: "タブID",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "instanceId",
              type: "string",
              description: "制御インスタンスID",
            }),
          ],
        }),
        permissions: [],
      }),
      // tabWaitForElement - workflow.js: floorp.tabWaitForElement(tabId, selector, 15000)
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
      // tabWaitForNetworkIdle - workflow.js: floorp.tabWaitForNetworkIdle(tabId)
      create(PluginFunctionSchema, {
        functionId: "tabWaitForNetworkIdle",
        functionName: "ネットワーク待機",
        description: "ページのネットワーク通信が完了するまで待機",
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
      // tabElementText - workflow.js: floorp.tabElementText(tabId, selector)
      create(PluginFunctionSchema, {
        functionId: "tabElementText",
        functionName: "テキスト取得",
        description: "指定した要素のテキスト内容を取得",
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
              name: "text",
              type: "string",
              description: "要素のテキスト (JSON形式)",
            }),
          ],
        }),
        permissions: [],
      }),
      // tabAttribute - workflow.js: floorp.tabAttribute(tabId, selector, "href")
      create(PluginFunctionSchema, {
        functionId: "tabAttribute",
        functionName: "属性取得",
        description: "指定した要素の属性値を取得",
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
              name: "attribute",
              type: "string",
              description: "取得する属性名 (href, src等)",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "value",
              type: "string",
              description: "属性値 (JSON形式)",
            }),
          ],
        }),
        permissions: [],
      }),
      // tabClick - workflow.js: floorp.tabClick(tabId, selector)
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
        permissions: [
          create(PermissionSchema, {
            displayName: "DOM操作",
            description: "ページ上の要素をクリック・操作する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/dom"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * LLM Chat プラグインを作成
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されている関数:
 * - llm_chat.chat(systemPrompt, userPrompt) - LLMチャット
 */
function createLlmChatPlugin() {
  return create(PluginPackageSchema, {
    packageId: "llm_chat",
    packageName: "LLM Chat",
    packageVersion: "1.0.0",
    description:
      "大規模言語モデル(LLM)とのチャット機能を提供するプラグイン（サブスクリプション分析・レポート生成用）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // chat - workflow.js: llm_chat.chat(systemPrompt, userPrompt)
      create(PluginFunctionSchema, {
        functionId: "chat",
        functionName: "チャット",
        description: "LLMにプロンプトを送信してレスポンスを取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "systemPrompt",
              type: "string",
              description: "システムプロンプト (LLMの役割定義)",
            }),
            create(FunctionParameterSchema, {
              name: "userPrompt",
              type: "string",
              description: "ユーザープロンプト (質問やタスク)",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "response",
              type: "string",
              description: "LLMからのレスポンス",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "LLMアクセス",
            description: "外部LLMサービスにアクセスする権限",
            permissionType: PermissionType.NET_ACCESS,
            resource: ["llm/chat"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * Exec プラグインを作成
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されている関数:
 * - app.sapphillon.core.exec.exec(cmd) - シェルコマンド実行
 */
function createExecPlugin() {
  return create(PluginPackageSchema, {
    packageId: "app.sapphillon.core.exec",
    packageName: "Exec",
    packageVersion: "1.0.0",
    description:
      "シェルコマンドを実行するプラグイン（アプリ検索、ディレクトリ作成など）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // exec - workflow.js: app.sapphillon.core.exec.exec(cmd)
      create(PluginFunctionSchema, {
        functionId: "exec",
        functionName: "コマンド実行",
        description: "シェルコマンドを実行して結果を取得",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "cmd",
              type: "string",
              description: "実行するシェルコマンド",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "stdout",
              type: "string",
              description: "標準出力",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "コマンド実行",
            description: "システムコマンドを実行する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["system/exec"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
    ],
  });
}

/**
 * Filesystem プラグインを作成
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されている関数:
 * - app.sapphillon.core.filesystem.write(path, content) - ファイル書き込み
 */
function createFilesystemPlugin() {
  return create(PluginPackageSchema, {
    packageId: "app.sapphillon.core.filesystem",
    packageName: "Filesystem",
    packageVersion: "1.0.0",
    description:
      "ファイルシステム操作を行うプラグイン（レポートファイル出力用）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // write - workflow.js: app.sapphillon.core.filesystem.write(path, content)
      create(PluginFunctionSchema, {
        functionId: "write",
        functionName: "ファイル書き込み",
        description: "ファイルにコンテンツを書き込む",
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
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "success",
              type: "boolean",
              description: "成功フラグ",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ファイル書き込み",
            description: "ファイルに書き込む権限",
            permissionType: PermissionType.FILESYSTEM_WRITE,
            resource: ["filesystem/write"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
    ],
  });
}

/**
 * OCR プラグインを作成（オプション）
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されている関数:
 * - ocr.extract_text(filePath) - PDFからテキスト抽出（請求書解析用）
 *
 * 注: workflow.jsでは typeof ocr !== "undefined" で存在確認されるオプションプラグイン
 */
function createOcrPlugin() {
  return create(PluginPackageSchema, {
    packageId: "ocr",
    packageName: "OCR",
    packageVersion: "1.0.0",
    description:
      "PDFや画像からテキストを抽出するプラグイン（請求書解析用 - オプション）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // extract_text - workflow.js: ocr.extract_text(filePath)
      create(PluginFunctionSchema, {
        functionId: "extract_text",
        functionName: "テキスト抽出",
        description: "PDFや画像ファイルからテキストを抽出",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "filePath",
              type: "string",
              description: "PDF/画像ファイルのパス",
            }),
          ],
          returns: [
            create(FunctionParameterSchema, {
              name: "text",
              type: "string",
              description: "抽出されたテキスト",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ファイル読み込み",
            description: "ファイルを読み込む権限",
            permissionType: PermissionType.FILESYSTEM_READ,
            resource: ["filesystem/read"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
    ],
  });
}

/**
 * 利用可能なモックプラグインを作成
 *
 * デモワークフロー (workflow.js - Subscription Optimization Deep Research) で使用されるプラグインを定義
 *
 * 使用プラグイン:
 * 1. Floorp - ブラウザ自動化 (browserTabs, createTab, closeTab, attachToTab, etc.)
 * 2. LLM Chat - LLMチャット (chat)
 * 3. Exec - コマンド実行 (exec)
 * 4. Filesystem - ファイル操作 (write)
 * 5. OCR - テキスト抽出 (extract_text) - オプション
 */
export function getMockPlugins() {
  return [
    createFloorpPlugin(),
    createLlmChatPlugin(),
    createExecPlugin(),
    createFilesystemPlugin(),
    createOcrPlugin(),
  ];
}

/**
 * ワークフローにモックのプラグインデータを追加する
 *
 * バックエンドから返されたワークフローにpluginPackagesが含まれていない場合、
 * デモ用にモックデータを追加します。
 *
 * workflow.js (Subscription Optimization Deep Research) で使用されるプラグインに基づいて検出:
 * - floorp.* → Floorp プラグイン
 * - llm_chat.* → LLM Chat プラグイン
 * - app.sapphillon.core.exec.* → Exec プラグイン
 * - app.sapphillon.core.filesystem.* → Filesystem プラグイン
 * - ocr.* → OCR プラグイン（オプション）
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
    // workflow.js: floorp.browserTabs, floorp.createTab, floorp.closeTab, etc.
    if (
      code.includes("floorp") ||
      code.includes("browsertabs") ||
      code.includes("createtab") ||
      code.includes("closetab") ||
      code.includes("attachtotab") ||
      code.includes("tabwaitforelement") ||
      code.includes("tabwaitfornetworkidle") ||
      code.includes("tabelementtext") ||
      code.includes("tabattribute") ||
      code.includes("tabclick")
    ) {
      selectedPlugins.push(mockPlugins[0]); // Floorp
    }

    // LLM Chat プラグイン
    // workflow.js: llm_chat.chat()
    if (
      code.includes("llm_chat") ||
      code.includes("llmchat") ||
      code.includes("llm.chat") ||
      code.includes("subscription") ||
      code.includes("optimization")
    ) {
      selectedPlugins.push(mockPlugins[1]); // LLM Chat
    }

    // Exec プラグイン
    // workflow.js: app.sapphillon.core.exec.exec()
    if (
      code.includes("app.sapphillon.core.exec") ||
      code.includes("exec.exec") ||
      code.includes("execsafe") ||
      code.includes("shellescape")
    ) {
      selectedPlugins.push(mockPlugins[2]); // Exec
    }

    // Filesystem プラグイン
    // workflow.js: app.sapphillon.core.filesystem.write()
    if (
      code.includes("app.sapphillon.core.filesystem") ||
      code.includes("filesystem.write") ||
      code.includes("writefile")
    ) {
      selectedPlugins.push(mockPlugins[3]); // Filesystem
    }

    // OCR プラグイン（オプション）
    // workflow.js: ocr.extract_text()
    if (
      code.includes("ocr") ||
      code.includes("extract_text") ||
      code.includes("extracttext")
    ) {
      selectedPlugins.push(mockPlugins[4]); // OCR
    }

    // 何も一致しない場合は、全プラグインをデフォルトとして追加
    // (Subscription Optimization ワークフローは全プラグインを使用するため)
    if (selectedPlugins.length === 0) {
      selectedPlugins.push(...mockPlugins);
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
