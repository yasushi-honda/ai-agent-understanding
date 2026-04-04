# MCPサーバー開発

## 概要
この環境内でMCPサーバーを構築・テストする場所。

## 構造
```
template/      MCPサーバーの雛形（コピーして使う）
examples/      サンプル実装
```

## クイックスタート

### 1. テンプレートからコピー
```bash
cp -r template/ my-server/
cd my-server && npm install
```

### 2. ツール定義を追加
`src/index.ts` を編集してツールを定義。

### 3. ビルド＆テスト
```bash
npm run build
# Claude Codeのsettings.jsonに追加してテスト
```

## MCPサーバーの3要素
- **Tools**: 実行可能なアクション
- **Resources**: 読み取り可能なデータ
- **Prompts**: 再利用可能なプロンプトテンプレート

## 参考
- [MCP公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
