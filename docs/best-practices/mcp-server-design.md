# MCPサーバー設計 ベストプラクティス

*調査日: 2026-04-04*

## 1. 設計原則

### 小さく、焦点を絞る
- **1サーバー = 1責務**: 1つのことをうまくやるサーバーを作る
- **動的ツールローディング**: 全MCPサーバーを常にロードしない（トークン浪費）
- **構造化エラーレスポンス**: 常に `isError: true` で返す

### ツール定義
- descriptionに**使用例を含める**（LLMが判断しやすくなる）
- パラメータのdescriptionも丁寧に書く
- 下流サービスへの過剰リクエストを防ぐ

## 2. セキュリティ（最重要）

### 認証・認可
- **OAuth 2.1** が2026年のHTTPベースMCPの標準
- **最小権限の原則**: エージェントが必要な権限だけ付与
- 環境ごとに認証情報を分離（dev/prod共有禁止）

### データ保護
- ログに機密データを出さない
- 入力バリデーション必須（LLMからの入力も信頼しない）

## 3. トランスポート選定

| トランスポート | 用途 | メリット |
|--------------|------|---------|
| **Streamable HTTP** | 本番推奨 | 単一エンドポイント、セッション管理、LB対応 |
| **stdio** | ローカル/DevOps | 認証情報がネットワークに出ない |
| **SSE** | レガシー | 非推奨（Streamable HTTPへ移行） |

## 4. 本番運用

### デプロイ戦略
- **Blue-Green デプロイ**: ゼロダウンタイム更新
- ヘルスチェックエンドポイント必須
- Prometheus形式でメトリクス公開

### 監視すべき3カテゴリ
1. **システム健全性**: CPU、メモリ、レイテンシ
2. **プロトコルメトリクス**: リクエスト数、エラー率
3. **ビジネスメトリクス**: ツール利用頻度、成功率

### よくある失敗
- 全MCPサーバーを全会話にロード → **動的ローディングで解決**
- dev/prodで認証情報共有 → **環境分離**
- エラーを握りつぶす → **isError: true で明示返却**

## 5. MCP SDKの現状（2026年4月）

- **月間DL数**: 9,700万（Python + TypeScript合計）
- **採用企業**: Anthropic, OpenAI, Google, Microsoft, Amazon（全主要AI企業）
- **利用可能サーバー**: 5,000+
- **ガバナンス**: Linux Foundation AAIF（Agentic AI Foundation）

## 出典
- [MCP Best Practices - 12 Rules (Apigene)](https://apigene.ai/blog/mcp-best-practices)
- [15 Best Practices for MCP Servers (The New Stack)](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)
- [Production-Ready MCP Servers Guide](https://webmcpguide.com/articles/production-ready-mcp-servers-guide)
- [MCP Server Best Practices 2026 (CData)](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [Build an MCP Server (公式)](https://modelcontextprotocol.io/docs/develop/build-server)
- [AWS MCP Server Deployment Guidance](https://aws.amazon.com/solutions/guidance/deploying-model-context-protocol-servers-on-aws/)
