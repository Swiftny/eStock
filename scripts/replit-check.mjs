import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const errors = [];
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  errors.push("Use Node.js 22.18 or newer.");
}

try {
  const database = new URL(process.env.DATABASE_URL || "");
  if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.hostname) {
    throw new Error("Invalid PostgreSQL URL");
  }
} catch {
  errors.push("Set DATABASE_URL to the hosted PostgreSQL connection string.");
}

const manager = process.env.ESTOCK_MANAGER_PASSWORD || "";
const staff = process.env.ESTOCK_STAFF_PASSWORD || "";
for (const [name, value] of [
  ["ESTOCK_MANAGER_PASSWORD", manager],
  ["ESTOCK_STAFF_PASSWORD", staff],
]) {
  if (!value || value !== value.trim() || value.length > 256) {
    errors.push(`Set ${name} to 1-256 characters with no surrounding whitespace.`);
  }
}
if (manager && manager === staff) {
  errors.push("Use different Manager and Staff passwords in production.");
}
if ((process.env.ESTOCK_SESSION_SECRET || "").length < 32) {
  errors.push("Set ESTOCK_SESSION_SECRET to a random value of at least 32 characters.");
}
if (!process.env.GEMINI_API_KEY?.trim()) {
  errors.push("Set GEMINI_API_KEY for server-side receipt extraction.");
}
if (process.env.ESTOCK_GEMINI_MODEL?.trim() !== "gemini-3.8-flash") {
  errors.push("Set ESTOCK_GEMINI_MODEL to gemini-3.8-flash; no model fallback is allowed.");
}

if (errors.length) {
  console.error("eStock deployment configuration needs attention:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("eStock deployment configuration is present. Provider connectivity is not tested.");
}
