export const MOCK_BILLING_ACCOUNT = {
  name: "billingAccounts/012345-ABCDEF-GHIJKL",
  displayName: "My GCP Billing Account",
  open: true,
  masterBillingAccount: "",
};

export const MOCK_COST_SUMMARY = {
  totalCost: 42.87,
  currency: "USD",
  services: [
    { service: "Cloud Run", cost: 5.23 },
    { service: "Cloud Storage", cost: 1.87 },
    { service: "Vertex AI", cost: 12.50 },
    { service: "Cloud SQL", cost: 8.45 },
    { service: "BigQuery", cost: 6.32 },
    { service: "Artifact Registry", cost: 2.10 },
    { service: "Cloud Build", cost: 3.75 },
    { service: "Cloud Firestore", cost: 2.65 },
  ],
};

// 過去7日分の日別コストデータ（異常検知テスト用）
export const MOCK_DAILY_COSTS: Record<string, number> = {
  "2026-03-30": 38.20,
  "2026-03-31": 39.15,
  "2026-04-01": 40.02,
  "2026-04-02": 39.88,
  "2026-04-03": 41.33,
  "2026-04-04": 42.87,
  "2026-04-05": 65.40, // 異常値（前日比+52%）
};

export const MOCK_SERVICE_COSTS: Record<string, { service: string; cost: number }[]> = {
  "2026-03": [
    { service: "Cloud Run", cost: 5.23 },
    { service: "Cloud Storage", cost: 1.87 },
    { service: "Vertex AI", cost: 12.50 },
    { service: "Cloud SQL", cost: 8.45 },
    { service: "BigQuery", cost: 6.32 },
    { service: "Artifact Registry", cost: 2.10 },
    { service: "Cloud Build", cost: 3.75 },
    { service: "Cloud Firestore", cost: 2.65 },
  ],
  "2026-04": [
    { service: "Cloud Run", cost: 6.80 },
    { service: "Cloud Storage", cost: 2.10 },
    { service: "Vertex AI", cost: 18.90 },
    { service: "Cloud SQL", cost: 8.45 },
    { service: "BigQuery", cost: 7.55 },
    { service: "Artifact Registry", cost: 2.10 },
    { service: "Cloud Build", cost: 4.20 },
    { service: "Cloud Firestore", cost: 3.10 },
  ],
};
