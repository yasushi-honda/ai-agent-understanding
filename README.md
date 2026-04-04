# AIエージェント理解

AIエージェントの研究・理解・実践を行うワークスペース。

## 構造

```
docs/                  知識・資料
  concepts/            概念理解（LLM, Function Calling, MCP, エージェントパターン）
  best-practices/      ベストプラクティス集
  tools/               ツール別ガイド（Claude Code, Codex, GCP）
  diagrams/            図解素材

mcp-servers/           MCPサーバー実装
  template/            テンプレート
  examples/            サンプル実装

experiments/           実験・検証コード

references/            外部参考資料リンク集
```

## 核心的理解

```
LLM（脳） → MCP（神経系・ハブ） → Function Calling（注文指令） → Function（実体・実行）
```

MCPの本質: Function Callingを疎結合・Plug&Playで使える標準プロトコル。

## 環境

- 主力: Claude Code (Opus 4.6)
- セカンドオピニオン: Codex
- クラウド: GCP
- コード管理: GitHub
