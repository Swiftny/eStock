import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const ORG = "synthetic-estock";
type DatabaseGlobal = typeof globalThis & { estockDatabase?: { path: string; db: DatabaseSync } };

export function databasePath() {
  // The database is a runtime volume, never an asset to bundle or trace.
  return resolve(/* turbopackIgnore: true */ process.env.ESTOCK_DB_PATH || "data/estock.sqlite");
}

export function getDb() {
  const scope = globalThis as DatabaseGlobal;
  const path = databasePath();
  if (scope.estockDatabase?.path === path) return scope.estockDatabase.db;
  if (scope.estockDatabase) scope.estockDatabase.db.close();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  if (!db.prepare("SELECT version FROM schema_migrations WHERE version=1").get()) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(readFileSync(resolve("db/migrations/001_initial.sql"), "utf8"));
      db.prepare("INSERT INTO schema_migrations VALUES(1,?)").run(new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      db.close();
      throw error;
    }
  }
  if (!db.prepare("SELECT version FROM schema_migrations WHERE version=2").get()) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(readFileSync(resolve("db/migrations/002_sessions.sql"), "utf8"));
      db.prepare("INSERT INTO schema_migrations VALUES(2,?)").run(new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      db.close();
      throw error;
    }
  }
  scope.estockDatabase = { path, db };
  return db;
}

export function closeDb() {
  const scope = globalThis as DatabaseGlobal;
  scope.estockDatabase?.db.close();
  delete scope.estockDatabase;
}

export function transaction<T>(callback: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function metadata(key: string) {
  return String(getDb().prepare("SELECT value FROM metadata WHERE key=?").get(key)?.value || "");
}

export function setMetadata(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    )
    .run(key, value);
}
