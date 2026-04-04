import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { join } from "node:path";
import { checkDocFreshness } from "./tools/freshness.js";
import { searchLatestInfo } from "./tools/search.js";
import { generateUpdateDiff } from "./tools/diff-gen.js";
import { applyDocUpdate } from "./tools/apply.js";

const DEFAULT_DOCS_DIR = join(process.cwd(), "docs");

const server = new McpServer({
  name: "doc-updater",
  version: "0.1.0",
});

// ツール1: ドキュメント鮮度チェック
server.tool(
  "check_doc_freshness",
  "docs/内ドキュメントの鮮度を調査し、30日以上更新されていないファイルをリストアップする",
  {
    docsDir: z
      .string()
      .optional()
      .describe("調査対象ディレクトリ（省略時: プロジェクトルートの docs/）"),
  },
  async ({ docsDir }) => {
    try {
      const targetDir = docsDir ?? DEFAULT_DOCS_DIR;
      const result = checkDocFreshness(targetDir);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: String(err),
              isError: true,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ツール2: 最新情報Web検索
server.tool(
  "search_latest_info",
  "指定トピックの最新情報をGemini + Google Search Groundingで検索する",
  {
    topic: z.string().describe("検索するトピック（例: 'MCP SDK TypeScript API'）"),
    context: z
      .string()
      .optional()
      .describe("追加コンテキスト（例: 現在のドキュメントの内容）"),
  },
  async ({ topic, context }) => {
    try {
      const result = await searchLatestInfo(topic, context);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: String(err),
              isError: true,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ツール3: 更新差分生成
server.tool(
  "generate_update_diff",
  "既存ドキュメントと最新情報を比較し、Geminiで更新提案を生成する",
  {
    filePath: z.string().describe("更新対象ファイルの絶対パス"),
    latestInfo: z
      .string()
      .describe("search_latest_info で取得した最新情報"),
  },
  async ({ filePath, latestInfo }) => {
    try {
      const result = await generateUpdateDiff(filePath, latestInfo);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: String(err),
              isError: true,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// ツール4: 更新適用
server.tool(
  "apply_doc_update",
  "生成された更新内容をファイルに適用する。dryRun=true（デフォルト）ではプレビューのみ",
  {
    filePath: z.string().describe("更新対象ファイルの絶対パス"),
    updatedContent: z
      .string()
      .describe("generate_update_diff で生成された更新後コンテンツ"),
    dryRun: z
      .boolean()
      .optional()
      .default(true)
      .describe("true=プレビューのみ（デフォルト）、false=実際に書き込む"),
  },
  async ({ filePath, updatedContent, dryRun }) => {
    try {
      const result = applyDocUpdate(filePath, updatedContent, dryRun ?? true);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: String(err),
              isError: true,
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
