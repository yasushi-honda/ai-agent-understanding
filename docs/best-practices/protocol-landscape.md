# AIエージェントプロトコル全体像（2026年4月）

*調査日: 2026-04-04*

## プロトコルマップ

```
┌─────────────────────────────────────────────┐
│           AIエージェントプロトコル             │
├─────────────────┬───────────────────────────┤
│  MCP            │  A2A                      │
│  (ツール接続)    │  (エージェント間連携)       │
│                 │                           │
│  エージェント    │  エージェント              │
│    ↕ ツール     │    ↕ エージェント          │
│                 │                           │
│  "USB-Cポート"  │  "チームワーク"            │
└─────────────────┴───────────────────────────┘
         ↓ 共にLinux Foundation AAIF管理下
```

## MCP vs A2A — 補完関係

| 項目 | MCP | A2A |
|------|-----|-----|
| **目的** | エージェント↔ツール/データ接続 | エージェント↔エージェント協調 |
| **比喩** | USB-Cポート（手を与える） | チームワーク（協調を与える） |
| **成熟度** | 非常に高い（9,700万DL/月） | 成長中（v1.0 early 2026） |
| **サーバー数** | 5,000+ | 成長中 |
| **プロトコル** | JSON-RPC 2.0 | gRPC, Agent Cards |
| **提唱者** | Anthropic | Google |

### 重要な認識
> **MCP と A2A は競合ではなく、同じスタックの2つのレイヤー。**
> MCPがエージェントに「手」を与え、A2Aがエージェントに「チームワーク」を与える。

## ガバナンス: AAIF

**Agentic AI Foundation**（Linux Foundation傘下、2025年12月設立）
- 共同創設者: OpenAI, Anthropic, Google, Microsoft, AWS, Block
- MCP と A2A の両方を管理
- オープンスタンダードとしての発展を推進

## 実践での使い分け

```
1つのエージェントがツールを使う → MCP
複数のエージェントが協力する   → A2A
両方必要                     → MCP + A2A（スタック）
```

### 現時点での推奨
- **まずMCPを習得** → 基盤技術として最も成熟
- A2Aは「複数の独立エージェントの協調」が必要になった時に検討
- Claude Code Agent Teamsは独自のOrchestration（MCP上で動作）

## 出典
- [MCP vs A2A Complete Guide (DEV Community)](https://dev.to/pockit_tools/mcp-vs-a2a-the-complete-guide-to-ai-agent-protocols-in-2026-30li)
- [MCP vs A2A (Auth0)](https://auth0.com/blog/mcp-vs-a2a/)
- [A2A and MCP Protocol Wars (Koyeb)](https://www.koyeb.com/blog/a2a-and-mcp-start-of-the-ai-agent-protocol-wars)
- [AI Agent Protocol Ecosystem Map 2026](https://www.digitalapplied.com/blog/ai-agent-protocol-ecosystem-map-2026-mcp-a2a-acp-ucp)
- [A2A Protocol Announcement (Google)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
