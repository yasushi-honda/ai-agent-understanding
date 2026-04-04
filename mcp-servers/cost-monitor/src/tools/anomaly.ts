import { BigQuery } from "@google-cloud/bigquery";
import { MOCK_DAILY_COSTS } from "../mock-data.js";

const isMockMode = process.env.MOCK_MODE === "true";

let bigqueryClient: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (!bigqueryClient) {
    bigqueryClient = new BigQuery();
  }
  return bigqueryClient;
}

const BILLING_DATASET = process.env.BILLING_BQ_DATASET ?? "billing_export";
const BILLING_TABLE = process.env.BILLING_BQ_TABLE ?? "gcp_billing_export_v1";

interface AnomalyResult {
  date: string;
  cost: number;
  previousDayCost: number | null;
  previousWeekCost: number | null;
  dayOverDayChange: number | null;
  weekOverWeekChange: number | null;
  anomalies: string[];
}

function calcChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export async function checkCostAnomaly(
  projectId: string,
  thresholdPercent: number
): Promise<{ content: [{ type: "text"; text: string }]; isError?: boolean }> {
  if (isMockMode) {
    const dates = Object.keys(MOCK_DAILY_COSTS).sort();
    const today = dates[dates.length - 1];
    const todayCost = MOCK_DAILY_COSTS[today];

    const yesterday = dates[dates.length - 2] ?? null;
    const previousDayCost = yesterday ? MOCK_DAILY_COSTS[yesterday] : null;

    // 前週同曜日（7日前）
    const todayIdx = dates.length - 1;
    const weekAgoIdx = todayIdx - 7;
    const weekAgoCost =
      weekAgoIdx >= 0 ? MOCK_DAILY_COSTS[dates[weekAgoIdx]] : null;

    const dayOverDayChange =
      previousDayCost !== null
        ? calcChangePercent(todayCost, previousDayCost)
        : null;
    const weekOverWeekChange =
      weekAgoCost !== null
        ? calcChangePercent(todayCost, weekAgoCost)
        : null;

    const anomalies: string[] = [];
    if (
      dayOverDayChange !== null &&
      Math.abs(dayOverDayChange) > thresholdPercent
    ) {
      anomalies.push(
        `前日比 ${dayOverDayChange > 0 ? "+" : ""}${dayOverDayChange}% (閾値: ±${thresholdPercent}%)`
      );
    }
    if (
      weekOverWeekChange !== null &&
      Math.abs(weekOverWeekChange) > thresholdPercent
    ) {
      anomalies.push(
        `前週比 ${weekOverWeekChange > 0 ? "+" : ""}${weekOverWeekChange}% (閾値: ±${thresholdPercent}%)`
      );
    }

    const result: AnomalyResult = {
      date: today,
      cost: todayCost,
      previousDayCost,
      previousWeekCost: weekAgoCost,
      dayOverDayChange,
      weekOverWeekChange,
      anomalies,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              thresholdPercent,
              hasAnomaly: anomalies.length > 0,
              result,
              recentDailyCosts: Object.entries(MOCK_DAILY_COSTS)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-7)
                .map(([date, cost]) => ({ date, cost })),
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

    // 直近8日分の日別コストを取得（前週比計算のため）
    const query = `
      SELECT
        DATE(usage_start_time) AS date,
        SUM(cost) AS cost
      FROM \`${projectId}.${BILLING_DATASET}.${BILLING_TABLE}\`
      WHERE
        project.id = @projectId
        AND DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
      GROUP BY date
      ORDER BY date DESC
      LIMIT 8
    `;

    const [rows] = await bq.query({
      query,
      params: { projectId },
    });

    if (rows.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                projectId,
                thresholdPercent,
                hasAnomaly: false,
                message: "コストデータがありません",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const sorted = rows
      .map((r: { date: { value: string } | string; cost: number }) => ({
        date:
          typeof r.date === "object" && "value" in r.date
            ? r.date.value
            : String(r.date),
        cost: r.cost,
      }))
      .sort(
        (a: { date: string }, b: { date: string }) =>
          b.date.localeCompare(a.date)
      );

    const today = sorted[0];
    const yesterday = sorted[1] ?? null;
    const weekAgo = sorted[7] ?? null;

    const dayOverDayChange =
      yesterday !== null
        ? calcChangePercent(today.cost, yesterday.cost)
        : null;
    const weekOverWeekChange =
      weekAgo !== null ? calcChangePercent(today.cost, weekAgo.cost) : null;

    const anomalies: string[] = [];
    if (
      dayOverDayChange !== null &&
      Math.abs(dayOverDayChange) > thresholdPercent
    ) {
      anomalies.push(
        `前日比 ${dayOverDayChange > 0 ? "+" : ""}${dayOverDayChange}% (閾値: ±${thresholdPercent}%)`
      );
    }
    if (
      weekOverWeekChange !== null &&
      Math.abs(weekOverWeekChange) > thresholdPercent
    ) {
      anomalies.push(
        `前週比 ${weekOverWeekChange > 0 ? "+" : ""}${weekOverWeekChange}% (閾値: ±${thresholdPercent}%)`
      );
    }

    const result: AnomalyResult = {
      date: today.date,
      cost: today.cost,
      previousDayCost: yesterday?.cost ?? null,
      previousWeekCost: weekAgo?.cost ?? null,
      dayOverDayChange,
      weekOverWeekChange,
      anomalies,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              thresholdPercent,
              hasAnomaly: anomalies.length > 0,
              result,
              recentDailyCosts: sorted
                .slice(0, 7)
                .map((r: { date: string; cost: number }) => ({
                  date: r.date,
                  cost: Math.round(r.cost * 100) / 100,
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
