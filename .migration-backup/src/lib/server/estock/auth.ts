import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ready, withTransaction } from "./db";
import { fail } from "./errors";

export type Role = "manager" | "staff";
export const COOKIE = "estock-session";
const DAY_MS = 86_400_000;

function config(): { manager: string; staff: string; secret: string } {
  const manager = process.env.ESTOCK_MANAGER_PASSWORD || "";
  const staff = process.env.ESTOCK_STAFF_PASSWORD || "";
  const secret = process.env.ESTOCK_SESSION_SECRET || "";
  if (!manager || !staff || secret.length < 32) {
    fail(
      "Manager/Staff passwords and a 32-character session secret must be configured.",
      503,
      "AUTH_NOT_CONFIGURED",
    );
  }
  const sharedDemoPassword =
    process.env.NODE_ENV === "development" &&
    process.env.ESTOCK_DEMO_ALLOW_SHARED_PASSWORD === "true";
  if (manager === staff && !sharedDemoPassword) {
    fail(
      "Use different Manager/Staff passwords. A shared demo password requires ESTOCK_DEMO_ALLOW_SHARED_PASSWORD=true in development.",
      503,
      "AUTH_NOT_CONFIGURED",
    );
  }
  return { manager, staff, secret };
}

function tokenHash(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function equalSecret(expected: string, supplied: string): boolean {
  const expectedHash = createHmac("sha256", "estock-password-check").update(expected).digest();
  const suppliedHash = createHmac("sha256", "estock-password-check").update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export async function signIn(role: Role, password: string): Promise<string> {
  const { manager, staff, secret } = config();
  if (!equalSecret(role === "manager" ? manager : staff, password)) {
    fail("Incorrect account password.", 401, "INVALID_CREDENTIALS");
  }
  const token = randomBytes(32).toString("base64url");
  const database = await ready();
  await database.query(
    "INSERT INTO estock_sessions(token_hash,account_id,role,expires_at) VALUES($1,$2,$3,$4)",
    [tokenHash(token, secret), role, role, new Date(Date.now() + DAY_MS).toISOString()],
  );
  return token;
}

export async function currentRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const { secret } = config();
  const database = await ready();
  const result = await database.query<{ role: Role }>(
    "SELECT role FROM estock_sessions WHERE token_hash=$1 AND expires_at>now()",
    [tokenHash(token, secret)],
  );
  return result.rows[0]?.role || null;
}

export async function requireRole(request: NextRequest, required?: Role): Promise<Role> {
  const role = await currentRole(request);
  if (!role) fail("Sign in to continue.", 401, "UNAUTHENTICATED");
  if (required && role !== required)
    fail(
      `This action is available to ${required === "staff" ? "Staff" : "Manager"} only.`,
      403,
      "FORBIDDEN",
    );
  return role;
}

export async function signOut(request: NextRequest): Promise<void> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return;
  const { secret } = config();
  await withTransaction(async (client) => {
    await client.query("DELETE FROM estock_sessions WHERE token_hash=$1", [
      tokenHash(token, secret),
    ]);
  });
}

export function sessionResponse(role: Role, token: string): NextResponse {
  const response = NextResponse.json({ role });
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DAY_MS / 1000,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export function clearedSessionResponse(): NextResponse {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
