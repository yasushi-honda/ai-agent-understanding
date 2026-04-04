# MCP (Model Context Protocol)

## 一言で言うと
Function Callingを簡単に使えるようにした**規格統一パッケージ**。

## 設計思想
- **疎結合な拡張性**: MCPサーバーをPlug&Playで追加可能
- **LLMは実装を知らなくてよい**: Schema定義だけで機能を発動
- **自然言語で特定の機能を発動**: ユーザーの意図→適切なツール選択
- **柔軟な「とっかかり」の設計**: ボタン化、チャットボット、スキル、サブエージェント

## アーキテクチャ

```
AIエージェントホスト
├── LLM（思考と判断）
└── Function Callingレイヤー
    ├── MCP Server A（RAG/知識検索）
    ├── MCP Server B（外部API連携）
    └── MCP Server C（データベース）
```

## MCPサーバーの3要素
1. **Tools**: 実行可能なアクション（例: `send_email`, `query_sql`）
2. **Resources**: 読み取り可能なデータ（例: `/documents`, `/users`）
3. **Prompts**: 再利用可能なプロンプトテンプレート

## MCPの利用形態
| 形態 | 説明 |
|------|------|
| システムのボタン化 | ワンボタンで複雑な処理を実行 |
| AIチャットボット | 対話的にMCPツールを呼び出す |
| Claude Codeスキル | `/skill` で呼び出し |
| サブエージェント | Agent Teamsから利用 |

## 関連図解
- [MCPが支えるFunction Callingアーキテクチャ](../diagrams/architecture/mcp-function-calling-architecture.png)
- [MCPサーバー自動生成フロー](../diagrams/architecture/mcp-server-generation-flow.png)
