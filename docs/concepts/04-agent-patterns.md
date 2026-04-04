# エージェントパターン

## 主要パターン

### ReAct (Reasoning + Acting)
思考→行動→観察のループ。最も基本的なエージェントパターン。
```
Thought: 何をすべきか考える
Action: ツールを呼び出す
Observation: 結果を観察する
→ 繰り返し
```

### Plan & Execute
先に計画を立て、順次実行する。複雑なタスクに有効。
```
Plan: タスクを分解して計画を立てる
Execute: 計画に沿って順次実行
Replan: 必要に応じて計画を修正
```

### Tool Use Agent
利用可能なツール群から最適なものを選んで実行する。
Claude Codeはこのパターンの代表例。

### Reflection / Self-Critique
自分の出力を評価し、改善する。Generator-Evaluator分離パターン。

## Claude Codeにおける実装
- **メインループ**: ReAct的な思考→ツール呼び出し→結果解釈
- **Plan Mode**: Plan & Executeパターン
- **Subagent**: 専門化されたTool Use Agent
- **Evaluator Agent**: Reflection/Self-Critique

<!-- TODO: 各パターンの詳細な比較と使い分け指針を追加 -->
