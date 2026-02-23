import { create } from "@bufbuild/protobuf";
import type { ServiceImpl } from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";
import { WorkflowService } from "@/gen/sapphillon/v1/workflow_service_pb";
import type {
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  FixWorkflowRequest,
  FixWorkflowResponse,
  RunWorkflowRequest,
  RunWorkflowResponse,
  GetWorkflowRequest,
  GetWorkflowResponse,
  ListWorkflowsRequest,
  ListWorkflowsResponse,
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
  DeleteWorkflowRequest,
  DeleteWorkflowResponse,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import {
  GenerateWorkflowResponseSchema,
  FixWorkflowResponseSchema,
  RunWorkflowResponseSchema,
  GetWorkflowResponseSchema,
  ListWorkflowsResponseSchema,
  UpdateWorkflowResponseSchema,
  DeleteWorkflowResponseSchema,
} from "@/gen/sapphillon/v1/workflow_service_pb";
import {
  WorkflowSchema,
  WorkflowLanguage as WFLang,
} from "@/gen/sapphillon/v1/workflow_pb";
import type { WorkflowResult } from "@/gen/sapphillon/v1/workflow_pb";
import {
  WorkflowResultSchema,
  WorkflowResultType as WFRType,
} from "@/gen/sapphillon/v1/workflow_pb";
import {
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  getPlugins,
} from "../data/mock-data";

/**
 * WorkflowServiceのモックハンドラー実装
 */
export const workflowHandler: ServiceImpl<typeof WorkflowService> = {
  /**
   * ワークフローを生成（ストリーミング）
   */
  async *generateWorkflow(
    request: GenerateWorkflowRequest
  ): AsyncIterable<GenerateWorkflowResponse> {
    if (!request.prompt || request.prompt.trim() === "") {
      throw new ConnectError("prompt is required", Code.InvalidArgument);
    }

    // 段階的にワークフローを生成するモック
    yield create(GenerateWorkflowResponseSchema, {
      workflowDefinition: create(WorkflowSchema, {
        id: `workflow-${Date.now()}`,
        displayName: `${request.prompt.substring(0, 30)}...`,
        description: request.prompt,
        workflowLanguage: WFLang.TYPESCRIPT,
        workflowCode: [],
      }),
    });

    // テスト用ワークフロー: 複数のプラグイン関数を使用
    const testCode = `// Generated workflow from: ${request.prompt}
import { fetch } from "com.sapphillon.http";
import { read_file, write_file } from "com.sapphillon.filesystem";
import { send_email, send_slack } from "com.sapphillon.notifications";
import { query } from "com.sapphillon.database";

function workflow() {
  // 1. HTTPリクエストでデータを取得
  const response = fetch({
    url: "https://api.example.com/data",
    method: "GET",
  });

  // 2. ファイルを読み込み
  const config = read_file({ path: "/config/settings.json" });

  // 3. データベースからユーザーを取得
  const users = query({
    sql: "SELECT * FROM users WHERE active = true",
  });

  // 4. 結果をファイルに保存
  write_file({
    path: "/output/result.json",
    content: JSON.stringify({ response, users }),
  });

  // 5. メール通知
  send_email({
    to: "admin@example.com",
    subject: "ワークフロー完了",
    body: "処理が完了しました",
  });

  // 6. Slack通知
  send_slack({
    channel: "#alerts",
    message: "ワークフローが正常に完了しました",
  });

  return { success: true, userCount: users.rowCount };
}
workflow();`;

    // 最終的なワークフローを返す（プラグイン関数情報付き）
    yield create(GenerateWorkflowResponseSchema, {
      workflowDefinition: create(WorkflowSchema, {
        id: `workflow-${Date.now()}`,
        displayName: `${request.prompt.substring(0, 30)}...`,
        description: request.prompt,
        workflowLanguage: WFLang.TYPESCRIPT,
        workflowCode: [
          {
            id: `code-${Date.now()}`,
            codeRevision: 1,
            code: testCode,
            language: WFLang.TYPESCRIPT,
            createdAt: {
              seconds: BigInt(Math.floor(Date.now() / 1000)),
              nanos: 0,
            },
            result: [],
            pluginPackages: getPlugins(), // モックプラグインデータを使用
            pluginFunctionIds: [
              "fetch",
              "read_file",
              "write_file",
              "send_email",
              "send_slack",
              "query",
            ],
            allowedPermissions: [],
          },
        ],
        createdAt: { seconds: BigInt(Math.floor(Date.now() / 1000)), nanos: 0 },
        updatedAt: { seconds: BigInt(Math.floor(Date.now() / 1000)), nanos: 0 },
        workflowResults: [],
      }),
    });
  },

  /**
   * ワークフローを修正（ストリーミング）
   */
  async *fixWorkflow(
    request: FixWorkflowRequest
  ): AsyncIterable<FixWorkflowResponse> {
    if (
      !request.workflowDefinition ||
      request.workflowDefinition.trim() === ""
    ) {
      throw new ConnectError(
        "workflow_definition is required",
        Code.InvalidArgument
      );
    }
    if (!request.description || request.description.trim() === "") {
      throw new ConnectError("description is required", Code.InvalidArgument);
    }

    // 修正されたワークフローを返すモック
    yield create(FixWorkflowResponseSchema, {
      fixedWorkflowDefinition: create(WorkflowSchema, {
        id: `workflow-fixed-${Date.now()}`,
        displayName: "Fixed Workflow",
        description: request.workflowDefinition,
        workflowLanguage: WFLang.TYPESCRIPT,
        workflowCode: [
          {
            id: `code-fixed-${Date.now()}`,
            codeRevision: 1,
            code: `// Fixed workflow\n${request.workflowDefinition}\n// Fixed based on: ${request.description}`,
            language: WFLang.TYPESCRIPT,
            createdAt: {
              seconds: BigInt(Math.floor(Date.now() / 1000)),
              nanos: 0,
            },
            result: [],
            pluginPackages: [],
            pluginFunctionIds: [],
            allowedPermissions: [],
          },
        ],
        createdAt: { seconds: BigInt(Math.floor(Date.now() / 1000)), nanos: 0 },
        updatedAt: { seconds: BigInt(Math.floor(Date.now() / 1000)), nanos: 0 },
        workflowResults: [],
      }),
      changeSummary: `Applied fixes based on: ${request.description}`,
    });
  },

  /**
   * ワークフローを実行
   */
  async runWorkflow(request: RunWorkflowRequest): Promise<RunWorkflowResponse> {
    if (!request.byId) {
      throw new ConnectError("by_id is required", Code.InvalidArgument);
    }

    const workflow = getWorkflowById(request.byId.workflowId);
    if (!workflow) {
      throw new ConnectError("Workflow not found", Code.NotFound);
    }

    // モックの実行結果を返す
    const result: WorkflowResult = create(WorkflowResultSchema, {
      id: `result-${Date.now()}`,
      displayName: `Run result for ${workflow.displayName}`,
      description: "Workflow executed successfully",
      result: JSON.stringify({ success: true, workflowId: workflow.id }),
      ranAt: { seconds: BigInt(Math.floor(Date.now() / 1000)), nanos: 0 },
      resultType: WFRType.SUCCESS_UNSPECIFIED,
      exitCode: 0,
      workflowResultRevision: 1,
    });

    return create(RunWorkflowResponseSchema, {
      workflowResult: result,
    });
  },

  /**
   * ワークフローを取得
   */
  async getWorkflow(request: GetWorkflowRequest): Promise<GetWorkflowResponse> {
    if (!request.workflowId) {
      throw new ConnectError("workflow_id is required", Code.InvalidArgument);
    }

    const workflow = getWorkflowById(request.workflowId);
    if (!workflow) {
      throw new ConnectError("Workflow not found", Code.NotFound);
    }

    return create(GetWorkflowResponseSchema, {
      workflow,
    });
  },

  /**
   * ワークフロー一覧を取得
   */
  async listWorkflows(
    request: ListWorkflowsRequest
  ): Promise<ListWorkflowsResponse> {
    console.log("[WorkflowService] listWorkflows called", request);
    let workflows = getWorkflows();

    // フィルタリング
    if (request.filter) {
      if (request.filter.displayName) {
        workflows = workflows.filter((w) =>
          w.displayName
            ?.toLowerCase()
            .includes(request.filter!.displayName!.toLowerCase())
        );
      }
      if (request.filter.workflowLanguage) {
        workflows = workflows.filter(
          (w) => w.workflowLanguage === request.filter!.workflowLanguage
        );
      }
    }

    // ソート
    if (request.orderBy && request.orderBy.length > 0) {
      workflows = [...workflows].sort((a, b) => {
        for (const order of request.orderBy) {
          const aVal = order.field === "display_name" ? a.displayName : "";
          const bVal = order.field === "display_name" ? b.displayName : "";
          const comparison = (aVal || "").localeCompare(bVal || "");
          if (comparison !== 0) {
            return order.direction === 2 ? -comparison : comparison; // 2 = DESC
          }
        }
        return 0;
      });
    }

    // ページネーション
    const pageSize = request.pageSize || 10;
    const startIndex = request.pageToken ? parseInt(request.pageToken, 10) : 0;
    const paginatedWorkflows = workflows.slice(
      startIndex,
      startIndex + pageSize
    );
    const nextPageToken =
      startIndex + pageSize < workflows.length
        ? (startIndex + pageSize).toString()
        : "";

    return create(ListWorkflowsResponseSchema, {
      workflows: paginatedWorkflows,
      nextPageToken,
    });
  },

  /**
   * ワークフローを更新
   */
  async updateWorkflow(
    request: UpdateWorkflowRequest
  ): Promise<UpdateWorkflowResponse> {
    if (!request.workflow || !request.workflow.id) {
      throw new ConnectError("workflow.id is required", Code.InvalidArgument);
    }

    const updated = updateWorkflow(request.workflow.id, request.workflow);
    if (!updated) {
      throw new ConnectError("Workflow not found", Code.NotFound);
    }

    const workflow = getWorkflowById(request.workflow.id);
    return create(UpdateWorkflowResponseSchema, {
      workflow,
    });
  },

  /**
   * ワークフローを削除
   */
  async deleteWorkflow(
    request: DeleteWorkflowRequest
  ): Promise<DeleteWorkflowResponse> {
    if (!request.workflowId) {
      throw new ConnectError("workflow_id is required", Code.InvalidArgument);
    }

    const deleted = deleteWorkflow(request.workflowId);
    if (!deleted) {
      throw new ConnectError("Workflow not found", Code.NotFound);
    }

    return create(DeleteWorkflowResponseSchema, {});
  },
};
