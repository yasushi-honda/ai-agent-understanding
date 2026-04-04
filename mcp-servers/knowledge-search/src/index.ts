import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PORT = parseInt(process.env.PORT || "8080", 10);
const DOCS_DIR = process.env.DOCS_DIR || join(process.cwd(), "docs");
const GCP_PROJECT = process.env.GCP_PROJECT || "ai-agent-lab-yh";
const GCP_LOCATION = process.env.GCP_LOCATION || "asia-northeast1";

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
const allDocsText = docs.map((d) => `--- ${d.path} ---\n${d.content}`).join("\n\n");
console.log(`Loaded ${docs.length} documents (${allDocsText.length} chars) from ${DOCS_DIR}`);

// --- Gemini クライアント (Vertex AI / Workload Identity) ---
const vertexAI = new VertexAI({ project: GCP_PROJECT, location: GCP_LOCATION });
const gemini = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const SYSTEM_PROMPT = `あなたはAIエージェントに関する知識検索アシスタントです。
以下のドキュメント群を参照して、ユーザーの質問に日本語で正確に回答してください。
回答にはドキュメントの内容を根拠として使い、参照元のファイルパスを示してください。
ドキュメントに記載がない内容については「このドキュメントには記載がありません」と正直に答えてください。

--- ドキュメント ---
${allDocsText}
--- ドキュメント終了 ---`;

async function askGemini(question: string): Promise<{ answer: string; sources: string[] }> {
  const result = await gemini.generateContent({
    contents: [{ role: "user", parts: [{ text: question }] }],
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
  });
  const answer = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "回答を生成できませんでした。";
  const sources = docs
    .filter((d) => answer.includes(d.path) || answer.toLowerCase().includes(d.title.toLowerCase()))
    .map((d) => d.path);
  return { answer, sources };
}

// --- MCPサーバー定義 ---
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "knowledge-search",
    version: "0.2.0",
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

  server.tool(
    "ask_question",
    "AIエージェントに関する質問をGeminiに問い合わせる。ドキュメントを参照して回答する。",
    { question: z.string().describe("質問内容") },
    async ({ question }) => {
      const { answer, sources } = await askGemini(question);
      return {
        content: [
          {
            type: "text" as const,
            text: `${answer}\n\n参照: ${sources.length > 0 ? sources.join(", ") : "（自動検出なし）"}`,
          },
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
  res.json({
    status: "ok",
    docs_loaded: docs.length,
    docs_chars: allDocsText.length,
    model: "gemini-2.5-flash",
    version: "0.2.0",
  });
});

// ドキュメント一覧
app.get("/api/docs", (_req, res) => {
  res.json(docs.map((d) => ({ path: d.path, title: d.title })));
});

// チャットAPI（ブラウザから利用）
app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "question is required" });
    return;
  }
  try {
    const { answer, sources } = await askGemini(question);
    res.json({ answer, sources });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
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
  console.log(`Knowledge Search MCP Server v0.2.0 running on port ${PORT}`);
  console.log(`  Model:  gemini-2.5-flash (Vertex AI / ${GCP_LOCATION})`);
  console.log(`  MCP:    POST /mcp`);
  console.log(`  Chat:   POST /api/chat`);
  console.log(`  Health: GET /api/health`);
});
