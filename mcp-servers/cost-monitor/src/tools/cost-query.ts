import { BigQuery } from "@google-cloud/bigquery";
import { MOCK_COST_SUMMARY, MOCK_SERVICE_COSTS } from "../mock-data.js";

const isMockMode = process.env.MOCK_MODE === "true";

let bigqueryClient: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    bigqueryClient = new BigQuery();
  }
  return bigqueryClient;
}

// GCP請求エクスポートテーブル名（環境変数で上書き可能）
const BILLING_DATASET = process.env.BILLING_BQ_DATASET ?? "billing_export";
const BILLING_TABLE = process.env.BILLING_BQ_TABLE ?? "gcp_billing_export_v1";

export async function getCostSummary(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<{ content: [{ type: "text"; text: string }]; isError?: boolean }> {
  if (isMockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              period: { startDate, endDate },
              ...MOCK_COST_SUMMARY,
              mock: true,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  try {
    const bq = getBigQueryClient();
    const query = `
      SELECT
        SUM(cost) AS totalCost,
        currency,
        ARRAY_AGG(STRUCT(service.description AS service, SUM(cost) AS cost) ORDER BY SUM(cost) DESC) AS services
      FROM \`${projectId}.${BILLING_DATASET}.${BILLING_TABLE}\`
      WHERE
        project.id = @projectId
        AND DATE(usage_start_time) BETWEEN @startDate AND @endDate
      GROUP BY currency
      LIMIT 1
    `;

    const [rows] = await bq.query({
      query,
      params: { projectId, startDate, endDate },
    });

    if (rows.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                projectId,
                period: { startDate, endDate },
                totalCost: 0,
                currency: "USD",
                services: [],
                message: "指定期間のコストデータがありません",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              period: { startDate, endDate },
              totalCost: rows[0].totalCost,
              currency: rows[0].currency,
              services: rows[0].services,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              isError: true,
              message: error instanceof Error ? error.message : String(error),
              projectId,
              period: { startDate, endDate },
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

export async function getCostByService(
  projectId: string,
  month: string
): Promise<{ content: [{ type: "text"; text: string }]; isError?: boolean }> {
  if (isMockMode) {
    const services = MOCK_SERVICE_COSTS[month] ?? MOCK_COST_SUMMARY.services;
    const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              month,
              totalCost: Math.round(totalCost * 100) / 100,
              currency: "USD",
              services: services.sort((a, b) => b.cost - a.cost),
              mock: true,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  try {
    const bq = getBigQueryClient();
    // month は "YYYY-MM" 形式
    const [year, monthNum] = month.split("-");
    const startDate = `${year}-${monthNum}-01`;
    const lastDay = new Date(Number(year), Number(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, "0")}`;

    const query = `
      SELECT
        service.description AS service,
        SUM(cost) AS cost,
        currency
      FROM \`${projectId}.${BILLING_DATASET}.${BILLING_TABLE}\`
      WHERE
        project.id = @projectId
        AND DATE(usage_start_time) BETWEEN @startDate AND @endDate
      GROUP BY service, currency
      ORDER BY cost DESC
    `;

    const [rows] = await bq.query({
      query,
      params: { projectId, startDate, endDate },
    });

    const totalCost = rows.reduce(
      (sum: number, row: { cost: number }) => sum + row.cost,
      0
    );
    const currency = rows.length > 0 ? rows[0].currency : "USD";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              month,
              totalCost: Math.round(totalCost * 100) / 100,
              currency,
              services: rows.map((row: { service: string; cost: number }) => ({
                service: row.service,
                cost: Math.round(row.cost * 100) / 100,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              isError: true,
              message: error instanceof Error ? error.message : String(error),
              projectId,
              month,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
