/**
 * マルチエージェント協調デモ
 *
 * multi-agent-coordinator MCPサーバーに接続し、
 * 複数エージェントによる協調タスクを実行する。
 *
 * 実行方法:
 *   cd mcp-servers/multi-agent-coordinator && npm install && npm run build
 *   cd ../../experiments/multi-agent
 *   npx tsx demo-orchestration.ts
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("=== マルチエージェント協調デモ ===\n");

  // coordinator サーバーに接続
  const transport = new StdioClientTransport({
    command: "node",
    args: ["../../mcp-servers/multi-agent-coordinator/dist/index.js"],
  });

  const client = new Client({ name: "demo-client", version: "0.1.0" });
  await client.connect(transport);
  console.log("Coordinator に接続しました\n");

  // 1. 利用可能なエージェント一覧を取得
  console.log("--- Step 1: エージェント一覧 ---");
  const agents = await client.callTool({
    name: "list_available_agents",
    arguments: {},
  });
  console.log(JSON.parse((agents.content as Array<{ text: string }>)[0].text));

  // 2. 協調タスクを作成
  console.log("\n--- Step 2: 協調タスクを作成 ---");
  const task = await client.callTool({
    name: "create_task",
    arguments: {
      objective:
        "GCPリソースの状態確認 → コスト異常検知 → ドキュメント鮮度チェック",
      requiredAgents: ["gcp-resource-manager", "cost-monitor", "doc-updater"],
      steps: [
        {
          agent: "gcp-resource-manager",
          action: "list_cloud_run_services",
          input: '{"projectId": "ai-agent-understanding"}',
        },
        {
          agent: "cost-monitor",
          action: "check_cost_anomaly",
          input: '{"projectId": "ai-agent-understanding"}',
        },
        {
          agent: "doc-updater",
          action: "check_doc_freshness",
        },
      ],
    },
  });
  const taskData = JSON.parse(
    (task.content as Array<{ text: string }>)[0].text
  );
  console.log(`タスク作成: ${taskData.id} (${taskData.status})`);

  // 3. タスクを実行
  console.log("\n--- Step 3: タスクを実行 ---");
  const result = await client.callTool({
    name: "execute_task",
    arguments: { taskId: taskData.id, mode: "sequential" },
  });
  const resultData = JSON.parse(
    (result.content as Array<{ text: string }>)[0].text
  );
  console.log(`タスク完了: ${resultData.status}`);
  for (const step of resultData.steps) {
    const icon = step.status === "completed" ? "OK" : "NG";
    console.log(`  [${icon}] ${step.agent}.${step.action}`);
    if (step.result) {
      const r = JSON.parse(step.result);
      console.log(`       => ${JSON.stringify(r).slice(0, 100)}...`);
    }
  }

  // 4. タスク状態を確認
  console.log("\n--- Step 4: 最終状態 ---");
  const status = await client.callTool({
    name: "get_task_status",
    arguments: { taskId: taskData.id },
  });
  console.log(JSON.parse((status.content as Array<{ text: string }>)[0].text));

  await client.close();
  console.log("\n=== デモ完了 ===");
}

main().catch(console.error);
