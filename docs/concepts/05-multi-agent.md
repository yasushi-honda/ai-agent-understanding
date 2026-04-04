# マルチエージェント協調

## 概要
複数のAIエージェントが協力してタスクを遂行するアーキテクチャ。

## パターン

### Orchestrator-Worker
1つのリーダーが複数のワーカーにタスクを分配・統合。
```
Orchestrator（リーダー）
├── Worker A（フロントエンド担当）
├── Worker B（バックエンド担当）
└── Worker C（テスト担当）
```

### Peer-to-Peer
対等なエージェント間でメッセージをやり取り。

### Pipeline
一方向にデータを受け渡し（A→B→C）。

## Claude Codeでの実装
- **Agent Teams**: TeamCreate → TaskCreate → Agent spawn
- **Subagent**: 専門エージェント（Explore, Plan, general-purpose）
- **/batch**: 独立した横断変更の並列実行

## 注意点
- 同一ファイルの同時編集は禁止
- エージェント結果は必ず自分で検証する
- 密結合な変更はAgent Teams、独立した変更は/batch

<!-- TODO: 実際のAgent Teams実行例を追加 -->
