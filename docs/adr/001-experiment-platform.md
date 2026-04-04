# ADR-001: 解説サイトからAIエージェント実験プラットフォームへの転換

**日付**: 2026-04-04
**ステータス**: 承認済み

## コンテキスト
静的な解説サイト（GitHub Pages）を、AIエージェントが実際に動作する実験プラットフォームへ進化させる。

## 決定事項

### アーキテクチャ: GitHub Pages + Cloud Run ハイブリッド
- フロントエンド: GitHub Pages（既存、無料）
- バックエンド: Cloud Run（サーバーレス、スケールtoゼロ）
- 知識検索: Gemini 2.0 Flash + Full Context Injection（ベクトルDB不要）

### 理由
- ドキュメント総量16KB。100万トークンウィンドウの0.002%。ベクトルDBは過剰
- Cloud Runはmin-instances=0で実質無料。実験用途に最適
- GitHub Pagesは静的配信で高速・無料。動的部分のみCloud Runに分離

### GCPプロジェクト
- ID: `ai-agent-lab-yh`
- リージョン: asia-northeast1
- Billing: `01EAA2-26BD24-E69348`
- 月額: $0-1見込み

### 却下した代替案
| 案 | 却下理由 |
|----|---------|
| 全面GCP移行 | フロントエンドの静的配信にCloud Runは過剰 |
| Vercel/Netlify | GCPに統一した方がMCPサーバーとの連携がシンプル |
| ベクトルDB（Firestore Vector Search） | 16KBにはオーバーエンジニアリング |
| Claude API（バックエンドLLM） | GCP統合（ADC認証）の利点を活かしGemini採用 |

### 将来の拡張パス
- 100KB超: Vertex AI Embeddings + インメモリベクトル検索に移行
- 1MB超: Firestore Vector Search に移行
- エージェント追加: 同じCloud Runプロジェクト内にサービス追加

## 影響
- `mcp-servers/knowledge-search/` にMCPサーバー新規追加
- `index.html` にチャットUI追加（CORS対応）
- GCPインフラ管理の運用負荷（軽微、スケールtoゼロ）
