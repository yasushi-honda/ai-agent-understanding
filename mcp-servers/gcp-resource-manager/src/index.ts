import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listCloudRunServices, getCloudRunService } from "./tools/cloud-run.js";
import { listGcsBuckets, getGcsBucketInfo, listGcsObjects } from "./tools/gcs.js";

const server = new McpServer({
  name: "gcp-resource-manager",
  version: "0.1.0",
});

// Cloud Run: サービス一覧
server.tool(
  "list_cloud_run_services",
  "Cloud Runサービスの一覧を取得する（読み取り専用）",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
    region: z.string().optional().describe("リージョン（省略時: asia-northeast1）"),
  },
  async ({ projectId, region }) => listCloudRunServices(projectId, region)
);

// Cloud Run: サービス詳細
server.tool(
  "get_cloud_run_service",
  "Cloud Runサービスの詳細情報を取得する（読み取り専用）",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
    serviceName: z.string().describe("サービス名"),
    region: z.string().optional().describe("リージョン（省略時: asia-northeast1）"),
  },
  async ({ projectId, serviceName, region }) =>
    getCloudRunService(projectId, serviceName, region)
);

// GCS: バケット一覧
server.tool(
  "list_gcs_buckets",
  "GCSバケットの一覧を取得する（読み取り専用）",
  {
    projectId: z.string().describe("GCPプロジェクトID"),
  },
  async ({ projectId }) => listGcsBuckets(projectId)
);

// GCS: バケット詳細
server.tool(
  "get_gcs_bucket_info",
  "GCSバケットの詳細情報を取得する（読み取り専用）",
  {
    bucketName: z.string().describe("バケット名"),
  },
  async ({ bucketName }) => getGcsBucketInfo(bucketName)
);

// GCS: オブジェクト一覧
server.tool(
  "list_gcs_objects",
  "GCSバケット内のオブジェクト一覧を取得する（読み取り専用）",
  {
    bucketName: z.string().describe("バケット名"),
    prefix: z.string().optional().describe("プレフィックスフィルター"),
    maxResults: z
      .number()
      .optional()
      .describe("最大取得件数（省略時: 20）"),
  },
  async ({ bucketName, prefix, maxResults }) =>
    listGcsObjects(bucketName, prefix, maxResults)
);

const transport = new StdioServerTransport();
await server.connect(transport);
