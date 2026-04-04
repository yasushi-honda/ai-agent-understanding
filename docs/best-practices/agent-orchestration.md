# エージェントオーケストレーション ベストプラクティス

*調査日: 2026-04-04*

## 1. Anthropicの設計哲学

### 「最もシンプルな解決策を見つけ、必要な場合にのみ複雑さを増す」

Anthropicの[Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)が確立した原則。

### Harness Design（2026年3月）

[Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)の核心:

- **「ハーネスが結果を決める」** — モデルの能力を引き出すのはハーネス（外枠）設計
- **Generator-Evaluator構造** — GAN的な生成→評価ループ
- **単純化の方向** — マルチエージェント→シングルエージェントへ簡素化しても性能維持
- **モデル向上に合わせてハーネスを進化** — 不要な足場を外す

### 6つのComposableパターン

| パターン | 用途 | 複雑さ |
|---------|------|--------|
| Prompt Chaining | 直列処理 | 低 |
| Routing | タスク振り分け | 低 |
| Parallelization | 独立タスクの並列実行 | 中 |
| Orchestrator-Workers | リーダー+ワーカー | 中 |
| Evaluator-Optimizer | 品質改善ループ | 中 |
| Autonomous Agent | 自律的なツール使用 | 高 |

**原則: 下から順に検討し、本当に必要な場合だけ上に行く。**

## 2. Claude Code Agent Teams

[Agent Teams](https://claudefa.st/blog/guide/agents/agent-teams)の3つの協調プリミティブ:

1. **SendMessage** — 型付きメッセージング
2. **TaskCreate** — 依存関係追跡付き共有ワークキュー
3. **Worktree隔離** — 安全な並列ファイル編集

### コンテキスト管理が最重要

> 「エージェント開発で最も困難な問題はコンテキスト管理であり、最も多くのエンジニアリング投資に値する」

- 4段階パイプライン: 入力→処理→出力→コンパクション
- バックグラウンドタスクはフォーク先で実行（メインの推論ループを汚染しない）

## 3. マルチエージェント vs シングルエージェント

Anthropicの実験結果:
- **モデルが十分に能力がある場合、簡素化しても性能は維持される**
- マルチエージェントが必要な場面: 並列処理、専門化が明確に有利な場合
- 不必要な複雑さ（エージェント間通信のオーバーヘッド）を避ける

## 出典
- [Building Effective Agents - Anthropic](https://www.anthropic.com/research/building-effective-agents)
- [Harness Design for Long-Running Apps - Anthropic Engineering](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Demystifying Evals for AI Agents - Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [Multi-Agent Research System - Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Claude Code Agent Teams Guide](https://claudefa.st/blog/guide/agents/agent-teams)
- [Claude Code Harness Architecture Insights](https://wavespeed.ai/blog/posts/claude-code-agent-harness-architecture/)
