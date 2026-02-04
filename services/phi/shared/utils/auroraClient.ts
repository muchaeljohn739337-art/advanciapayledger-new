import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

export function initAuroraPool(connectionString: string) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected Aurora pool error:", err);
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error("Aurora pool not initialized. Call initAuroraPool first.");
  }
  return pool;
}

export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SET app.tenant_id = $1", [tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows;
}
