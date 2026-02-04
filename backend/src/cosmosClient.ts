import { CosmosClient } from "@azure/cosmos";
import winston from "winston";

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;

if (!endpoint || !key) {
  throw new Error("COSMOS_DB_ENDPOINT and COSMOS_DB_KEY must be set");
}

const client = new CosmosClient({
  endpoint,
  key,
  connectionPolicy: {
    enableEndpointDiscovery: true,
    preferredLocations:
      process.env.COSMOS_DB_PREFERRED_REGIONS?.split(",") || [],
  },
  consistencyLevel: "Session", // Adjust based on needs
});

export { client };
