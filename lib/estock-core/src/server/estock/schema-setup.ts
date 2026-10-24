/**
 * Development-only schema setup. Published databases are migrated by Publish,
 * never by the running application.
 */
import pg from "pg";
import { fileURLToPath } from "node:url";
import { migrate } from "../../../db/estock/migrate.mjs";

if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1") {
  throw new Error("Schema setup is development-only. Use Publish for production schema changes.");
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
const previous = process.cwd();
try {
  process.chdir(fileURLToPath(new URL("../../../", import.meta.url)));
  await migrate(client);
} finally {
  process.chdir(previous);
  client.release();
  await pool.end();
}
