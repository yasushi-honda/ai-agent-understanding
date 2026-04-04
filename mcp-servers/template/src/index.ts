import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "template-server",
  version: "0.1.0",
});

// ツール定義例
server.tool(
  "hello",
  "挨拶を返すサンプルツール",
  { name: z.string().describe("名前") },
  async ({ name }) => ({
    content: [{ type: "text", text: `こんにちは、${name}さん！` }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
