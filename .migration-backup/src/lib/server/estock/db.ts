import { Pool, type PoolClient } from "pg";
import { migrate } from "../../../../db/estock/migrate.mjs";
import { EstockError } from "./errors";

let pool: Pool | null = null;
let migration: Promise<void> | null = null;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new EstockError(
      "PostgreSQL is not configured. Set DATABASE_URL in .env.local.",
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
  const database = getPool();
  if (!migration) {
    migration = (async () => {
      try {
        const client = await database.connect();
        try {
          await migrate(client);
        } finally {
          client.release();
        }
      } catch {
        throw new EstockError(
          "PostgreSQL is unavailable or the eStock schema could not be prepared.",
          503,
          "DATABASE_UNAVAILABLE",
        );
      }
    })().catch((error) => {
      migration = null;
      throw error;
    });
  }
  await migration;
  return database;
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
