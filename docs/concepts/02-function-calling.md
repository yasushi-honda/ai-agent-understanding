# Function Calling

## 概要
LLMが外部機能を呼び出すための万能インターフェース。「注文指令」に相当する。

## 仕組み
1. **指示**: ユーザーが自然言語で依頼
2. **思考**: LLMが適切なFunction（関数）を選択
3. **呼び出し**: 関数名と引数をJSON形式で生成
4. **実行**: ホスト側が実際のFunctionを実行
5. **結果**: 実行結果をLLMに返却、LLMが解釈して応答

## Function定義（Schema）
```json
{
  "name": "calc_total",
  "description": "合計金額を計算する",
  "parameters": {
    "type": "object",
    "properties": {
      "price": { "type": "number", "description": "単価" },
      "quantity": { "type": "integer", "description": "数量" }
    },
    "required": ["price", "quantity"]
  }
}
```

## MCPとの関係
Function Callingは「接続の仕組み」。MCPはこれを「簡単に・統一的に使える」ようにしたプロトコル。

## 関連図解
- [Function CallingとMCPの関係性](../diagrams/architecture/fc-mcp-relationship.png)
