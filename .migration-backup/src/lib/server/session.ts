import { createHash, randomBytes } from "node:crypto";
import type { Role } from "../contracts.ts";
import { getDb, ORG } from "./db.ts";
import { fail } from "./validation.ts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function createSession(role: Role) {
  const token = randomBytes(32).toString("hex");
  getDb()
    .prepare("INSERT INTO demo_sessions VALUES(?,?,?,?)")
    .run(hash(token), ORG, role, new Date(Date.now() + 86400000).toISOString());
  return token;
}
export function sessionRole(token?: string): Role {
  if (!token) fail("Choose a synthetic demo role to continue.", 401);
  const session = getDb()
    .prepare("SELECT role, expires_at FROM demo_sessions WHERE token_hash=? AND org_id=?")
    .get(hash(token), ORG);
  if (!session || String(session.expires_at) < new Date().toISOString())
    fail("Your demo session expired. Choose a role again.", 401);
  return session.role as Role;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  if (origin && new URL(origin).host !== host) fail("Cross-origin mutations are not allowed.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    fail("Cross-site mutations are not allowed.", 403);
}
