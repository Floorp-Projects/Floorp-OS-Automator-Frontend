/**
 * @fileoverview ワークフローのモックデータ生成ユーティリティ
 *
 * 本番環境でもバックエンドから十分なデータが返ってこない場合に、
 * デモ用にモックデータを提供するためのユーティリティです。
 *
 * このモックデータは demo_workflows/workflow.js (Video Site Comparison) で
 * 実際に使用されているプラグインと関数を正確に反映しています。
 *
 * @module lib/mock-workflow-data
 *
 * ============================================================================
 * 使用プラグイン一覧 (workflow.js 解析結果)
 * ============================================================================
 *
 * 1. floorp (com.floorp.browser) - ブラウザ自動化
 *    - createTab, destroyTabInstance, closeTab, tabWaitForElement
 *    - tabWaitForNetworkIdle, tabScrollTo, tabElementText, tabAttribute
 *    - tabElementScreenshot, browserTabs, attachToTab, tabUploadFile
 *    - tabSetInnerHTML, tabClick
 *
 * 2. excel (app.sapphillon.core.excel) - Excel操作
 *    - writeRangeWithImages, openInApp, saveBase64Image
 *
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
 * workflow.js (Video Site Comparison) で使用されている関数:
 * - floorp.createTab(url, waitForLoad) - タブ作成
 * - floorp.destroyTabInstance(tabId) - インスタンス解放
 * - floorp.closeTab(tabId) - タブを閉じる
 * - floorp.tabWaitForElement(tabId, selector, timeout) - 要素待機
 * - floorp.tabWaitForNetworkIdle(tabId, timeout) - ネットワーク待機
 * - floorp.tabScrollTo(tabId, selector) - スクロール
 * - floorp.tabElementText(tabId, selector) - テキスト取得
 * - floorp.tabAttribute(tabId, selector, attribute) - 属性取得
 * - floorp.tabElementScreenshot(tabId, selector) - 要素スクリーンショット
 * - floorp.browserTabs() - 全タブ取得
 * - floorp.attachToTab(tabId) - タブにアタッチ
 * - floorp.tabUploadFile(tabId, selector, filePath) - ファイルアップロード
 * - floorp.tabSetInnerHTML(tabId, selector, html) - innerHTML設定
 * - floorp.tabClick(tabId, selector) - クリック
 */
function createFloorpPlugin() {
  return create(PluginPackageSchema, {
    packageId: "com.floorp.browser",
    packageName: "Floorp",
    packageVersion: "1.0.0",
    description:
      "Floorpブラウザのタブ操作、スクレイピング、DOM操作を行う内蔵プラグイン（Video Site Comparison対応）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // createTab - workflow.js: floorp.createTab(ytUrl, false)
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
      // destroyTabInstance - workflow.js: floorp.destroyTabInstance(ytTab)
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
      // tabWaitForElement - workflow.js: floorp.tabWaitForElement(ytTab, "ytd-video-renderer #video-title", 10000)
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
      // tabWaitForNetworkIdle - workflow.js: floorp.tabWaitForNetworkIdle(ytTab, 3000)
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
      // tabScrollTo - workflow.js: floorp.tabScrollTo(ytTab, "ytd-continuation-item-renderer")
      create(PluginFunctionSchema, {
        functionId: "tabScrollTo",
        functionName: "スクロール",
        description: "指定した要素までページをスクロール（Lazy Loading対応）",
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
      // tabElementText - workflow.js: floorp.tabElementText(tab, sel)
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
      // tabAttribute - workflow.js: floorp.tabAttribute(ytTab, titleSel, "href")
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
      // tabElementScreenshot - workflow.js: floorp.tabElementScreenshot(tab, sel)
      create(PluginFunctionSchema, {
        functionId: "tabElementScreenshot",
        functionName: "要素スクリーンショット",
        description: "指定した要素のスクリーンショットをBase64で取得",
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
              name: "image",
              type: "string",
              description: "Base64エンコードされた画像 (JSON形式)",
            }),
          ],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "スクリーンショット",
            description: "ページ要素のスクリーンショットを撮影する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/screenshot"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
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
          returns: [],
        }),
        permissions: [],
      }),
      // tabUploadFile - workflow.js: floorp.tabUploadFile(tabId, fileInputSelector, filePath)
      create(PluginFunctionSchema, {
        functionId: "tabUploadFile",
        functionName: "ファイルアップロード",
        description: "ファイル入力要素にファイルを設定",
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
              description: "ファイル入力のCSSセレクタ",
            }),
            create(FunctionParameterSchema, {
              name: "filePath",
              type: "string",
              description: "アップロードするファイルのパス",
            }),
          ],
          returns: [],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "ファイルアップロード",
            description: "Webページにファイルをアップロードする権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/upload"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
      // tabSetInnerHTML - workflow.js: floorp.tabSetInnerHTML(tabId, inputSelector, message)
      create(PluginFunctionSchema, {
        functionId: "tabSetInnerHTML",
        functionName: "innerHTML設定",
        description: "指定した要素のinnerHTMLを設定",
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
              name: "html",
              type: "string",
              description: "設定するHTML/テキスト",
            }),
          ],
          returns: [],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "DOM操作",
            description: "ページのDOM要素を変更する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["browser/dom"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
      // tabClick - workflow.js: floorp.tabClick(tabId, sendButtonSelector)
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
 * Excelスプレッドシート操作プラグインを作成
 *
 * workflow.js (Video Site Comparison) で使用されている関数:
 * - excel.writeRangeWithImages(filePath, sheetName, data, images) - 画像付きデータ書き込み
 * - excel.openInApp(filePath) - アプリで開く
 * - excel.saveBase64Image(base64, filePath) - Base64画像を保存
 */
function createExcelPlugin() {
  return create(PluginPackageSchema, {
    packageId: "app.sapphillon.core.excel",
    packageName: "Excel",
    packageVersion: "1.0.0",
    description:
      "Excelファイルの作成・編集、画像挿入、グラフ作成を行うプラグイン（Video Site Comparison対応）",
    pluginStoreUrl: "",
    verified: true,
    internalPlugin: true,
    deprecated: false,
    installedAt: createTimestamp(),
    updatedAt: createTimestamp(),
    functions: [
      // writeRangeWithImages - workflow.js: excel.writeRangeWithImages(excelPath, "動画比較", rowData, images)
      create(PluginFunctionSchema, {
        functionId: "writeRangeWithImages",
        functionName: "画像付きデータ書き込み",
        description:
          "スプレッドシートにデータと画像を書き込み（サムネイル埋め込み対応）",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "filePath",
              type: "string",
              description: "Excelファイルパス",
            }),
            create(FunctionParameterSchema, {
              name: "sheetName",
              type: "string",
              description: "シート名",
            }),
            create(FunctionParameterSchema, {
              name: "data",
              type: "array",
              description: "書き込むデータの2次元配列",
            }),
            create(FunctionParameterSchema, {
              name: "images",
              type: "array",
              description: "挿入する画像の配列 [{cell, path}]",
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
            description: "Excelファイルにデータと画像を書き込む権限",
            permissionType: PermissionType.FILESYSTEM_WRITE,
            resource: ["filesystem/write", "excel/write"],
            permissionLevel: PermissionLevel.HIGH,
          }),
        ],
      }),
      // openInApp - workflow.js: excel.openInApp(excelPath)
      create(PluginFunctionSchema, {
        functionId: "openInApp",
        functionName: "アプリで開く",
        description: "ExcelファイルをExcelアプリケーションで開く",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "filePath",
              type: "string",
              description: "Excelファイルパス",
            }),
          ],
          returns: [],
        }),
        permissions: [
          create(PermissionSchema, {
            displayName: "アプリケーション起動",
            description: "外部アプリケーションを起動する権限",
            permissionType: PermissionType.EXECUTE,
            resource: ["system/app"],
            permissionLevel: PermissionLevel.MEDIUM,
          }),
        ],
      }),
      // saveBase64Image - workflow.js: excel.saveBase64Image(base64Data, imgPath)
      create(PluginFunctionSchema, {
        functionId: "saveBase64Image",
        functionName: "Base64画像保存",
        description: "Base64エンコードされた画像データをファイルに保存",
        functionDefine: create(FunctionDefineSchema, {
          parameters: [
            create(FunctionParameterSchema, {
              name: "base64Data",
              type: "string",
              description: "Base64エンコードされた画像データ",
            }),
            create(FunctionParameterSchema, {
              name: "filePath",
              type: "string",
              description: "保存先ファイルパス",
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
            description: "画像ファイルを書き込む権限",
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
 * 利用可能なモックプラグインを作成
 *
 * デモワークフロー (workflow.js - Video Site Comparison) で使用されるプラグインを定義
 *
 * 使用プラグイン:
 * 1. Floorp - ブラウザ自動化 (createTab, closeTab, tabElementScreenshot, browserTabs, etc.)
 * 2. Excel - スプレッドシート操作 (writeRangeWithImages, openInApp, saveBase64Image)
 */
export function getMockPlugins() {
  return [createFloorpPlugin(), createExcelPlugin()];
}

/**
 * ワークフローにモックのプラグインデータを追加する
 *
 * バックエンドから返されたワークフローにpluginPackagesが含まれていない場合、
 * デモ用にモックデータを追加します。
 *
 * workflow.js (Video Site Comparison) で使用されるプラグインに基づいて検出:
 * - floorp.* → Floorp プラグイン
 * - excel.* → Excel プラグイン
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
    // workflow.js: floorp.createTab, floorp.tabElementScreenshot, floorp.browserTabs, etc.
    if (
      code.includes("floorp") ||
      code.includes("createtab") ||
      code.includes("closetab") ||
      code.includes("destroytabinstance") ||
      code.includes("tabwaitforelement") ||
      code.includes("tabwaitfornetworkidle") ||
      code.includes("tabscrollto") ||
      code.includes("tabelementtext") ||
      code.includes("tabattribute") ||
      code.includes("tabelementscreenshot") ||
      code.includes("browsertabs") ||
      code.includes("attachtotab") ||
      code.includes("tabuploadfile") ||
      code.includes("tabsetinnerhtml") ||
      code.includes("tabclick")
    ) {
      selectedPlugins.push(mockPlugins[0]); // Floorp
    }

    // Excel スプレッドシート操作プラグイン
    // workflow.js: excel.writeRangeWithImages, excel.openInApp, excel.saveBase64Image
    if (
      code.includes("excel") ||
      code.includes("writerangewithimages") ||
      code.includes("openinapp") ||
      code.includes("savebase64image") ||
      code.includes("spreadsheet") ||
      code.includes(".xlsx")
    ) {
      selectedPlugins.push(mockPlugins[1]); // Excel
    }

    // 何も一致しない場合は、全プラグインをデフォルトとして追加
    // (Video Site Comparison ワークフローは全プラグインを使用するため)
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
