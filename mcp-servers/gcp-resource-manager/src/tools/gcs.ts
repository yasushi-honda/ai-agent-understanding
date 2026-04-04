import { Storage } from "@google-cloud/storage";

export async function listGcsBuckets(
  projectId: string
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const storage = new Storage({ projectId });
    const [buckets] = await storage.getBuckets();

    const result = buckets.map((bucket) => ({
      name: bucket.name,
      location: bucket.metadata.location,
      storageClass: bucket.metadata.storageClass,
      timeCreated: bucket.metadata.timeCreated,
      updated: bucket.metadata.updated,
      locationType: bucket.metadata.locationType,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ projectId, count: result.length, buckets: result }, null, 2),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error listing GCS buckets: ${message}` }],
      isError: true,
    };
  }
}

export async function getGcsBucketInfo(
  bucketName: string
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const storage = new Storage();
    const [metadata] = await storage.bucket(bucketName).getMetadata();

    const result = {
      name: metadata.name,
      location: metadata.location,
      locationType: metadata.locationType,
      storageClass: metadata.storageClass,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
      projectNumber: metadata.projectNumber,
      iamConfiguration: metadata.iamConfiguration,
      versioning: metadata.versioning,
      cors: metadata.cors,
      lifecycle: metadata.lifecycle,
      labels: metadata.labels,
      metageneration: metadata.metageneration,
      retentionPolicy: metadata.retentionPolicy,
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
      content: [{ type: "text", text: `Error getting GCS bucket info: ${message}` }],
      isError: true,
    };
  }
}

export async function listGcsObjects(
  bucketName: string,
  prefix?: string,
  maxResults: number = 20
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const storage = new Storage();
    const options: { prefix?: string; maxResults: number } = { maxResults };
    if (prefix) {
      options.prefix = prefix;
    }

    const [files] = await storage.bucket(bucketName).getFiles(options);

    const result = files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      timeCreated: file.metadata.timeCreated,
      updated: file.metadata.updated,
      storageClass: file.metadata.storageClass,
      md5Hash: file.metadata.md5Hash,
      generation: file.metadata.generation,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { bucketName, prefix: prefix ?? null, count: result.length, objects: result },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error listing GCS objects: ${message}` }],
      isError: true,
    };
  }
}
