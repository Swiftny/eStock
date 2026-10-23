import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL?.trim()) {
  console.error("Set DATABASE_URL in .env.local or your environment before migration.");
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(readFileSync(resolve("db/estock/001_initial.sql"), "utf8"));
    console.log("eStock PostgreSQL schema is ready.");
  } catch (error) {
    console.error("Could not prepare the eStock PostgreSQL schema:", error instanceof Error ? error.name : "unknown");
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
