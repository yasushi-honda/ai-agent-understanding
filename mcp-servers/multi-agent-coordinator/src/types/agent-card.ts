/**
 * A2A Agent Card 仕様を参考にした型定義
 * 参考: https://google.github.io/A2A/#/documentation
 *
 * A2Aでは /.well-known/agent.json でAgent Cardを公開する。
 * ここではMCPサーバーのメタデータとしてローカルに定義する。
 */
export interface AgentCard {
  name: string;
  description: string;
  url?: string;
  capabilities: string[];
  inputModes: string[];
  outputModes: string[];
  authentication?: {
    type: "adc" | "none";
  };
}

export interface AgentRegistry {
  [agentName: string]: AgentCard;
}
