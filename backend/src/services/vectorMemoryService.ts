import { client } from "../cosmosClient";
import winston from "winston";

const databaseId = process.env.COSMOS_DB_DATABASE_ID || "advancia";
const containerId = "vectorMemory";

const container = client.database(databaseId).container(containerId);

export interface VectorMemoryItem {
  id: string;
  tenantId?: string;
  userId: string;
  embedding: number[];
  context?: string;
  createdAt: string;
}

export class VectorMemoryService {
  static async storeVector(
    userId: string,
    embedding: number[],
    context?: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const item: VectorMemoryItem = {
        id: `${userId}-${Date.now()}`,
        tenantId: tenantId ?? "default",
        userId,
        embedding,
        context,
        createdAt: new Date().toISOString(),
      };

      const start = Date.now();
      const response = await container.items.create(item);
      const durationMs = Date.now() - start;
      const rc = (response as any).requestCharge;
      const diagnostics = (response as any).diagnostics;
      if (durationMs > 200) {
        winston.warn("Cosmos insert latency high", {
          userId,
          tenantId: item.tenantId,
          durationMs,
          requestCharge: rc,
          diagnostics,
        });
      }
      winston.info("Vector stored successfully", { userId, id: item.id });
    } catch (error) {
      winston.error("Error storing vector", { error, userId });
      throw error;
    }
  }

  static async searchSimilarVectors(
    userId: string,
    queryEmbedding: number[],
    topK: number = 10,
    threshold: number = 0.8,
    tenantId?: string,
  ): Promise<VectorMemoryItem[]> {
    try {
      const querySpec = {
        query: `
          SELECT TOP @topK c.id, c.userId, c.embedding, c.context, c.createdAt, VectorDistance(c.embedding, @queryVector) AS distance
          FROM c
          WHERE c.userId = @userId AND VectorDistance(c.embedding, @queryVector) < @threshold
          ORDER BY VectorDistance(c.embedding, @queryVector)
        `,
        parameters: [
          { name: "@userId", value: userId },
          { name: "@queryVector", value: queryEmbedding },
          { name: "@topK", value: topK },
          { name: "@threshold", value: threshold },
        ],
      };

      const start = Date.now();
      const { resources, requestCharge, diagnostics } = await container.items
        .query(querySpec, { partitionKey: [tenantId ?? "default", userId] })
        .fetchAll();
      const durationMs = Date.now() - start;
      if (durationMs > 300) {
        winston.warn("Cosmos query latency high", {
          userId,
          tenantId: tenantId ?? "default",
          durationMs,
          requestCharge,
          diagnostics,
        });
      }
      return resources as VectorMemoryItem[];
    } catch (error) {
      winston.error("Error searching vectors", { error, userId });
      throw error;
    }
  }

  static async deleteVector(
    userId: string,
    id: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      await container.item(id, [tenantId ?? "default", userId]).delete();
      winston.info("Vector deleted successfully", { userId, id });
    } catch (error) {
      winston.error("Error deleting vector", { error, userId, id });
      throw error;
    }
  }
}
