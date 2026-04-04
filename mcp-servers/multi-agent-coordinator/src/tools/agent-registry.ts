import type { AgentCard, AgentRegistry } from "../types/agent-card.js";

/**
 * 利用可能なエージェント（MCPサーバー）のレジストリ。
 *
 * A2Aプロトコルでは /.well-known/agent.json でAgent Cardを公開するが、
 * ここではローカル定義で模擬する。
 * 将来的にはMCP Client SDKでサーバーに接続し、tool listingで
 * capabilitiesを動的に取得する方式に移行可能。
 */
const registry: AgentRegistry = {
  "knowledge-search": {
    name: "knowledge-search",
    description:
      "AIエージェント理解プロジェクトの知識ベースを検索し、質問に回答するエージェント。Gemini 2.5 Flash + RAGベース。",
    url: "https://knowledge-search-1063017745459.asia-northeast1.run.app",
    capabilities: ["list_topics", "search_docs", "ask_question"],
    inputModes: ["text"],
    outputModes: ["text", "json"],
    authentication: { type: "none" },
  },
  "gcp-resource-manager": {
    name: "gcp-resource-manager",
    description:
      "GCPリソース（Cloud Run、GCS）の状態を読み取り専用で確認するエージェント。",
    capabilities: [
      "list_cloud_run_services",
      "get_cloud_run_service",
      "list_gcs_buckets",
      "get_gcs_bucket_info",
      "list_gcs_objects",
    ],
    inputModes: ["json"],
    outputModes: ["json"],
    authentication: { type: "adc" },
  },
  "cost-monitor": {
    name: "cost-monitor",
    description:
      "GCPプロジェクトのコスト監視・異常検知を行うエージェント。Billing API + BigQuery。",
    capabilities: [
      "get_billing_account",
      "get_cost_summary",
      "get_cost_by_service",
      "check_cost_anomaly",
    ],
    inputModes: ["json"],
    outputModes: ["json"],
    authentication: { type: "adc" },
  },
  "doc-updater": {
    name: "doc-updater",
    description:
      "ドキュメントの鮮度チェックとWeb検索による自動更新を行うエージェント。Gemini + Google Search Grounding。",
    capabilities: [
      "check_doc_freshness",
      "search_latest_info",
      "generate_update_diff",
      "apply_doc_update",
    ],
    inputModes: ["text", "json"],
    outputModes: ["text", "json"],
    authentication: { type: "adc" },
  },
};

export function listAgents(): AgentCard[] {
  return Object.values(registry);
}

export function getAgentCard(agentName: string): AgentCard | undefined {
  return registry[agentName];
}

export function getRegisteredAgentNames(): string[] {
  return Object.keys(registry);
}
