import { ServicesClient } from "@google-cloud/run";

const DEFAULT_REGION = "asia-northeast1";

function getParent(projectId: string, region: string): string {
  return `projects/${projectId}/locations/${region}`;
}

function getServiceName(
  projectId: string,
  serviceName: string,
  region: string
): string {
  return `projects/${projectId}/locations/${region}/services/${serviceName}`;
}

export async function listCloudRunServices(
  projectId: string,
  region: string = DEFAULT_REGION
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const client = new ServicesClient();
    const parent = getParent(projectId, region);
    const [services] = await client.listServices({ parent });

    const result = services.map((svc) => ({
      name: svc.name?.split("/").pop(),
      fullName: svc.name,
      url: svc.uri,
      region,
      generation: svc.generation,
      conditions: svc.conditions?.map((c) => ({
        type: c.type,
        state: c.state,
        message: c.message,
      })),
      latestCreatedRevision: svc.latestCreatedRevision,
      latestReadyRevision: svc.latestReadyRevision,
      observedGeneration: svc.observedGeneration,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ projectId, region, count: result.length, services: result }, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error listing Cloud Run services: ${message}` }],
      isError: true,
    };
  }
}

export async function getCloudRunService(
  projectId: string,
  serviceName: string,
  region: string = DEFAULT_REGION
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const client = new ServicesClient();
    const name = getServiceName(projectId, serviceName, region);
    const [service] = await client.getService({ name });

    const result = {
      name: service.name?.split("/").pop(),
      fullName: service.name,
      url: service.uri,
      region,
      generation: service.generation,
      observedGeneration: service.observedGeneration,
      conditions: service.conditions?.map((c) => ({
        type: c.type,
        state: c.state,
        message: c.message,
        lastTransitionTime: c.lastTransitionTime,
      })),
      latestCreatedRevision: service.latestCreatedRevision,
      latestReadyRevision: service.latestReadyRevision,
      template: service.template
        ? {
            containers: service.template.containers?.map((c) => ({
              image: c.image,
              resources: c.resources,
              env: c.env?.map((e) => ({ name: e.name, value: e.value })),
            })),
            scaling: service.template.scaling,
            serviceAccount: service.template.serviceAccount,
            timeout: service.template.timeout,
          }
        : undefined,
      traffic: service.traffic?.map((t) => ({
        type: t.type,
        revision: t.revision,
        percent: t.percent,
      })),
      trafficStatuses: service.trafficStatuses?.map((t) => ({
        type: t.type,
        revision: t.revision,
        percent: t.percent,
        uri: t.uri,
      })),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error getting Cloud Run service: ${message}` }],
      isError: true,
    };
  }
}
