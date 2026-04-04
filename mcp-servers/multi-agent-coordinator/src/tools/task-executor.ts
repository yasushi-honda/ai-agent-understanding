import type { Task } from "../types/task.js";
import { getAgentCard } from "./agent-registry.js";
import {
  getTask,
  updateTaskStatus,
  updateStepStatus,
} from "./task-manager.js";

/**
 * タスク実行エンジン。
 *
 * 本来はMCP Client SDKを使って各MCPサーバーにstdio/HTTP接続し、
 * ツールを直接呼び出す。ここでは実験目的で模擬実行を行う。
 *
 * 将来の拡張ポイント:
 * - StdioClientTransport で各サーバーにプロセス接続
 * - SSEClientTransport でHTTPサーバーに接続
 * - A2Aプロトコルが成熟したらgRPC接続に切り替え
 */
async function simulateAgentCall(
  agentName: string,
  action: string,
  input?: string
): Promise<string> {
  const card = getAgentCard(agentName);
  if (!card) {
    throw new Error(`エージェント '${agentName}' が見つかりません`);
  }

  if (!card.capabilities.includes(action)) {
    throw new Error(
      `エージェント '${agentName}' にツール '${action}' がありません。利用可能: ${card.capabilities.join(", ")}`
    );
  }

  // 模擬実行: 実際にはMCP Client SDKでツールを呼び出す
  // ここでは各エージェントの応答をシミュレート
  await new Promise((resolve) => setTimeout(resolve, 100));

  const simulations: Record<string, Record<string, string>> = {
    "gcp-resource-manager": {
      list_cloud_run_services: JSON.stringify({
        services: [
          {
            name: "knowledge-search",
            region: "asia-northeast1",
            status: "ACTIVE",
            url: "https://knowledge-search-xxx.run.app",
          },
        ],
      }),
      get_cloud_run_service: JSON.stringify({
        name: "knowledge-search",
        status: "ACTIVE",
        memory: "512Mi",
        cpu: "1",
        minInstances: 0,
        maxInstances: 10,
        lastDeployed: "2026-04-04T10:00:00Z",
      }),
      list_gcs_buckets: JSON.stringify({
        buckets: [{ name: "ai-agent-docs", location: "ASIA-NORTHEAST1" }],
      }),
      get_gcs_bucket_info: JSON.stringify({
        name: "ai-agent-docs",
        storageClass: "STANDARD",
        objectCount: 42,
      }),
      list_gcs_objects: JSON.stringify({
        objects: [
          { name: "docs/concepts/01-llm.md", size: 2048 },
          { name: "docs/concepts/02-function-calling.md", size: 3072 },
        ],
      }),
    },
    "cost-monitor": {
      get_billing_account: JSON.stringify({
        billingAccountId: "01XXXX-YYYYYY-ZZZZZZ",
        projectId: "ai-agent-understanding",
        status: "OPEN",
      }),
      get_cost_summary: JSON.stringify({
        totalCost: 19.6,
        currency: "USD",
        period: "2026-04-01 ~ 2026-04-04",
      }),
      get_cost_by_service: JSON.stringify({
        services: [
          { name: "Cloud Run", cost: 5.23 },
          { name: "Cloud Storage", cost: 1.87 },
          { name: "Vertex AI", cost: 12.5 },
        ],
      }),
      check_cost_anomaly: JSON.stringify({
        hasAnomaly: true,
        anomalies: [
          {
            date: "2026-04-04",
            dailyCost: 8.5,
            previousDayCost: 5.6,
            changePercent: 51.8,
            alert: "前日比+52%のコスト増加を検知",
          },
        ],
      }),
    },
    "doc-updater": {
      check_doc_freshness: JSON.stringify({
        staleDocuments: [
          {
            file: "docs/best-practices/mcp-server-design.md",
            lastUpdated: "2026-03-01",
            daysSinceUpdate: 34,
          },
        ],
        freshDocuments: 8,
        totalDocuments: 9,
      }),
      search_latest_info: JSON.stringify({
        topic: "MCP SDK latest version",
        results: "MCP SDK v1.30.0 released (2026-04-02)",
        sources: ["https://github.com/modelcontextprotocol/typescript-sdk"],
      }),
      generate_update_diff: JSON.stringify({
        summary: "MCP SDKバージョンを1.29.0→1.30.0に更新",
        changesCount: 2,
      }),
      apply_doc_update: JSON.stringify({
        applied: false,
        dryRun: true,
        preview: "ドキュメント更新のプレビュー表示",
      }),
    },
    "knowledge-search": {
      list_topics: JSON.stringify({
        topics: ["LLM基礎", "Function Calling", "MCP", "エージェントパターン"],
      }),
      search_docs: JSON.stringify({
        results: [{ file: "concepts/03-mcp.md", matches: 5 }],
      }),
      ask_question: JSON.stringify({
        answer: "MCPはFunction Callingを簡単に使えるようにした規格統一パッケージです。",
        sources: ["concepts/03-mcp.md"],
      }),
    },
  };

  const agentSim = simulations[agentName];
  if (agentSim && agentSim[action]) {
    return agentSim[action];
  }

  return JSON.stringify({
    status: "simulated",
    agent: agentName,
    action,
    input: input || null,
    message: `${agentName}.${action} の模擬実行結果`,
  });
}

export async function executeTask(
  taskId: string,
  mode: "sequential" | "parallel" = "sequential"
): Promise<Task> {
  const task = getTask(taskId);
  if (!task) throw new Error(`タスク ${taskId} が見つかりません`);

  updateTaskStatus(taskId, "running");

  if (mode === "sequential") {
    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];
      updateStepStatus(taskId, i, "running");
      try {
        const result = await simulateAgentCall(
          step.agent,
          step.action,
          step.input
        );
        updateStepStatus(taskId, i, "completed", result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        updateStepStatus(taskId, i, "failed", undefined, msg);
        updateTaskStatus(taskId, "failed");
        return getTask(taskId)!;
      }
    }
  } else {
    const promises = task.steps.map(async (step, i) => {
      updateStepStatus(taskId, i, "running");
      try {
        const result = await simulateAgentCall(
          step.agent,
          step.action,
          step.input
        );
        updateStepStatus(taskId, i, "completed", result);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        updateStepStatus(taskId, i, "failed", undefined, msg);
      }
    });
    await Promise.all(promises);

    const hasFailed = task.steps.some((s) => s.status === "failed");
    if (hasFailed) {
      updateTaskStatus(taskId, "failed");
      return getTask(taskId)!;
    }
  }

  updateTaskStatus(taskId, "completed");
  return getTask(taskId)!;
}
