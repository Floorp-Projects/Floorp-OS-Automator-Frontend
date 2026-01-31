import { create } from "@bufbuild/protobuf";
import type { ServiceImpl } from "@connectrpc/connect";
import { PluginService } from "@/gen/sapphillon/v1/plugin_service_pb";
import type {
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginsRequest,
  ListPluginsResponse,
  UninstallPluginRequest,
  UninstallPluginResponse,
} from "@/gen/sapphillon/v1/plugin_service_pb";
import {
  InstallPluginResponseSchema,
  ListPluginsResponseSchema,
  UninstallPluginResponseSchema,
} from "@/gen/sapphillon/v1/plugin_service_pb";
import { getPlugins } from "../data/mock-data";

/**
 * PluginServiceのモックハンドラー実装
 */
export const pluginHandler: ServiceImpl<typeof PluginService> = {
  /**
   * プラグイン一覧を取得
   */
  async listPlugins(request: ListPluginsRequest): Promise<ListPluginsResponse> {
    console.log("[PluginService] listPlugins called", request);
    const plugins = getPlugins();

    // ページネーション
    const pageSize = request.pageSize || 10;
    const startIndex = request.pageToken ? parseInt(request.pageToken, 10) : 0;
    const paginatedPlugins = plugins.slice(startIndex, startIndex + pageSize);
    const nextPageToken =
      startIndex + pageSize < plugins.length
        ? (startIndex + pageSize).toString()
        : "";

    return create(ListPluginsResponseSchema, {
      plugins: paginatedPlugins,
      nextPageToken,
    });
  },

  /**
   * プラグインをインストール（モック）
   */
  async installPlugin(
    request: InstallPluginRequest,
  ): Promise<InstallPluginResponse> {
    console.log("[PluginService] installPlugin called", request);
    // モック: 成功レスポンスを返す
    return create(InstallPluginResponseSchema, {
      status: {
        code: 0, // OK
        message: `Plugin installed from: ${request.uri}`,
      },
    });
  },

  /**
   * プラグインをアンインストール（モック）
   */
  async uninstallPlugin(
    request: UninstallPluginRequest,
  ): Promise<UninstallPluginResponse> {
    console.log("[PluginService] uninstallPlugin called", request);
    // モック: 成功レスポンスを返す
    return create(UninstallPluginResponseSchema, {
      status: {
        code: 0, // OK
        message: `Plugin uninstalled: ${request.packageId}`,
      },
    });
  },
};
