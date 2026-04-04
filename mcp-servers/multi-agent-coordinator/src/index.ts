import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listAgents, getAgentCard } from "./tools/agent-registry.js";
import { createTask, getTask } from "./tools/task-manager.js";
import { executeTask } from "./tools/task-executor.js";

const server = new McpServer({
  name: "multi-agent-coordinator",
  version: "0.1.0",
});

// --- Tool: list_available_agents ---
server.tool(
  "list_available_agents",
  "利用可能なエージェント（MCPサーバー）の一覧とAgent Card情報を返す",
  {},
  async () => {
    const agents = listAgents();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              agents: agents.map((a) => ({
                name: a.name,
                description: a.description,
                capabilities: a.capabilities,
                authentication: a.authentication?.type || "none",
              })),
              totalAgents: agents.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Tool: get_agent_card ---
server.tool(
  "get_agent_card",
  "特定エージェントのAgent Card（能力、入出力、認証要件）を取得する。A2Aの/.well-known/agent.json相当。",
  {
    agentName: z.string().describe("エージェント名"),
  },
  async ({ agentName }) => {
    const card = getAgentCard(agentName);
    if (!card) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `エージェント '${agentName}' が見つかりません`,
              availableAgents: listAgents().map((a) => a.name),
            }),
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
    };
  }
);

// --- Tool: create_task ---
server.tool(
  "create_task",
  "協調タスクを作成する。目的、必要なエージェント、実行ステップを定義。",
  {
    objective: z.string().describe("タスクの目的"),
    requiredAgents: z
      .array(z.string())
      .describe("必要なエージェント名のリスト"),
    steps: z
      .array(
        z.object({
          agent: z.string().describe("実行するエージェント名"),
          action: z.string().describe("呼び出すツール名"),
          input: z.string().optional().describe("入力データ（JSON文字列）"),
        })
      )
      .describe("実行ステップの配列"),
  },
  async ({ objective, requiredAgents, steps }) => {
    try {
      const task = createTask(objective, requiredAgents, steps);
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: e instanceof Error ? e.message : String(e),
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Tool: execute_task ---
server.tool(
  "execute_task",
  "作成したタスクを実行する。各ステップを順次またはparallel形式で処理。",
  {
    taskId: z.string().describe("create_taskで作成したタスクID"),
    mode: z
      .enum(["sequential", "parallel"])
      .optional()
      .default("sequential")
      .describe("実行モード"),
  },
  async ({ taskId, mode }) => {
    try {
      const result = await executeTask(taskId, mode);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: e instanceof Error ? e.message : String(e),
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Tool: get_task_status ---
server.tool(
  "get_task_status",
  "タスクの実行状況を確認する。",
  {
    taskId: z.string().describe("タスクID"),
  },
  async ({ taskId }) => {
    const task = getTask(taskId);
    if (!task) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `タスク '${taskId}' が見つかりません`,
            }),
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: task.id,
              objective: task.objective,
              status: task.status,
              steps: task.steps.map((s, i) => ({
                step: i + 1,
                agent: s.agent,
                action: s.action,
                status: s.status,
                hasResult: !!s.result,
                error: s.error,
              })),
              createdAt: task.createdAt,
              completedAt: task.completedAt,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
