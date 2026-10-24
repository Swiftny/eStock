import { Pool, type PoolClient } from "pg";
import { EstockError } from "./errors";

let pool: Pool | null = null;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new EstockError(
      "PostgreSQL is not configured. Configure DATABASE_URL in Replit Secrets.",
      503,
      "DATABASE_NOT_CONFIGURED",
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function ready(): Promise<Pool> {
  // Schema is prepared in development and carried to production by Publish.
  // Never run DDL on incoming application requests.
  return getPool();
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const database = await ready();
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
