import { existsSync } from "node:fs";
import pg from "pg";
import { migrate } from "../db/estock/migrate.mjs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL?.trim()) {
  console.error("Set DATABASE_URL in .env.local or your environment before migration.");
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await migrate(client);
    console.log("eStock PostgreSQL schema is ready.");
  } catch (error) {
    console.error("Could not prepare the eStock PostgreSQL schema:", error instanceof Error ? error.name : "unknown");
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
