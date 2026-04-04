import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getBillingAccount } from "./tools/billing.js";
import { getCostSummary, getCostByService } from "./tools/cost-query.js";
import { checkCostAnomaly } from "./tools/anomaly.js";

const server = new McpServer({
  name: "cost-monitor-mcp",
  version: "0.1.0",
});

// ツール1: 請求アカウント情報取得
server.tool(
  "get_billing_account",
  "プロジェクトの請求アカウント情報を取得する",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
  },
  async ({ projectId }) => getBillingAccount(projectId)
);

// ツール2: コストサマリー取得
server.tool(
  "get_cost_summary",
  "指定期間のコストサマリーを取得する",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
    startDate: z.string().describe("開始日 (YYYY-MM-DD形式)"),
    endDate: z.string().describe("終了日 (YYYY-MM-DD形式)"),
  },
  async ({ projectId, startDate, endDate }) =>
    getCostSummary(projectId, startDate, endDate)
);

// ツール3: サービス別コスト内訳
server.tool(
  "get_cost_by_service",
  "指定月のサービス別コスト内訳を取得する",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
    month: z.string().describe("対象月 (YYYY-MM形式)"),
  },
  async ({ projectId, month }) => getCostByService(projectId, month)
);

// ツール4: コスト異常検知
server.tool(
  "check_cost_anomaly",
  "前日比・前週比でコスト異常を検知する",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
    thresholdPercent: z
      .number()
      .optional()
      .default(50)
      .describe("異常とみなす変化率の閾値（パーセント、デフォルト: 50）"),
  },
  async ({ projectId, thresholdPercent }) =>
    checkCostAnomaly(projectId, thresholdPercent ?? 50)
);

const transport = new StdioServerTransport();
await server.connect(transport);
