import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CloudBillingClient } from "@google-cloud/billing";
import { MOCK_BILLING_ACCOUNT } from "../mock-data.js";

const isMockMode = process.env.MOCK_MODE === "true";

let billingClient: CloudBillingClient | null = null;

function getBillingClient(): CloudBillingClient {
  if (!billingClient) {
    billingClient = new CloudBillingClient();
  }
  return billingClient;
}

export async function getBillingAccount(
  projectId: string
): Promise<{ content: [{ type: "text"; text: string }]; isError?: boolean }> {
  if (isMockMode) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              billingAccount: MOCK_BILLING_ACCOUNT,
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
    const client = getBillingClient();
    const [projectBillingInfo] = await client.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    if (!projectBillingInfo.billingEnabled) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                projectId,
                billingEnabled: false,
                message: "このプロジェクトでは請求が有効になっていません",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const billingAccountName = projectBillingInfo.billingAccountName ?? "";
    const [accountInfo] = await client.getBillingAccount({
      name: billingAccountName,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectId,
              billingAccount: {
                name: accountInfo.name,
                displayName: accountInfo.displayName,
                open: accountInfo.open,
                masterBillingAccount: accountInfo.masterBillingAccount,
              },
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
