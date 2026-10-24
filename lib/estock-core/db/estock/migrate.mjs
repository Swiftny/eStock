import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Both the setup command and application use this ordered, transactional runner.
export async function migrate(client) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext(current_schema()), 20261024)");
    await client.query("CREATE TABLE IF NOT EXISTS estock_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const folder = resolve(process.cwd(), "db/estock");
    for (const name of readdirSync(folder).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
      const applied = await client.query("SELECT 1 FROM estock_schema_migrations WHERE name=$1", [name]);
      if (applied.rowCount) continue;
      await client.query(readFileSync(resolve(folder, name), "utf8"));
      await client.query("INSERT INTO estock_schema_migrations(name) VALUES($1)", [name]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
