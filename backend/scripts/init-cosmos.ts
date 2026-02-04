const { client } = require("../src/cosmosClient");

const databaseId = process.env.COSMOS_DB_DATABASE_ID || "advancia";
const containerId = "vectorMemory";

async function initCosmosDB() {
  try {
    // Create database if it doesn't exist
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });
    console.log(`Database '${databaseId}' created or already exists.`);

    // Create container if it doesn't exist
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      // Use Hierarchical Partition Keys (HPK) for scale and targeted queries
      partitionKey: { paths: ["/tenantId", "/userId"] },
      indexingPolicy: {
        includedPaths: [
          {
            path: "/*",
          },
        ],
        excludedPaths: [
          {
            path: "/embedding/?",
          }, // Exclude embedding from indexing for performance
        ],
      },
      vectorEmbeddingPolicy: {
        vectorEmbeddings: [
          {
            path: "/embedding",
            dataType: "float32",
            dimensions: 1536, // Adjust based on your embedding model (e.g., OpenAI ada-002)
            distanceFunction: "cosine",
          },
        ],
      },
    });
    console.log(`Container '${containerId}' created or already exists.`);

    console.log("Cosmos DB initialization complete.");
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    process.exit(1);
  }
}

initCosmosDB();
