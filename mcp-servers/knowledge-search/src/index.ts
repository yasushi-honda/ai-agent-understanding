import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PORT = parseInt(process.env.PORT || "8080", 10);
const DOCS_DIR = process.env.DOCS_DIR || join(process.cwd(), "docs");

// --- ドキュメントローダー ---
interface DocEntry {
  path: string;
  title: string;
  content: string;
}

function loadDocs(dir: string): DocEntry[] {
  const docs: DocEntry[] = [];
  function walk(currentDir: string) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
        const titleMatch = content.match(/^#\s+(.+)/m);
        docs.push({
          path: relative(dir, fullPath),
          title: titleMatch?.[1] || entry.replace(".md", ""),
          content,
        });
      }
    }
  }
  try {
    walk(dir);
  } catch {
    console.warn(`Docs directory not found: ${dir}`);
  }
  return docs;
}

const docs = loadDocs(DOCS_DIR);
console.log(`Loaded ${docs.length} documents from ${DOCS_DIR}`);

// --- MCPサーバー定義 ---
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "knowledge-search",
    version: "0.1.0",
  });

  server.tool(
    "list_topics",
    "利用可能なドキュメントトピック一覧を返す",
    {},
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            docs.map((d) => ({ path: d.path, title: d.title })),
            null,
            2
          ),
        },
      ],
    })
  );

  server.tool(
    "search_docs",
    "キーワードでドキュメントを全文検索する",
    { query: z.string().describe("検索キーワード") },
    async ({ query }) => {
      const lower = query.toLowerCase();
      const results = docs
        .filter(
          (d) =>
            d.content.toLowerCase().includes(lower) ||
            d.title.toLowerCase().includes(lower)
        )
        .map((d) => {
          const lines = d.content.split("\n");
          const matchLines = lines.filter((l) =>
            l.toLowerCase().includes(lower)
          );
          return {
            path: d.path,
            title: d.title,
            matches: matchLines.slice(0, 5),
          };
        });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    }
  );

  return server;
}

// --- Express アプリ ---
const app = express();
app.use(
  cors({
    origin: [
      "https://yasushi-honda.github.io",
      "http://localhost:3000",
      "http://localhost:8080",
    ],
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", docs_loaded: docs.length, version: "0.1.0" });
});

// ドキュメント一覧
app.get("/api/docs", (_req, res) => {
  res.json(docs.map((d) => ({ path: d.path, title: d.title })));
});

// MCP Streamable HTTP エンドポイント（ステートレス）
app.post("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Knowledge Search MCP Server running on port ${PORT}`);
  console.log(`  MCP endpoint: POST /mcp`);
  console.log(`  REST API:     GET /api/health, GET /api/docs`);
});
