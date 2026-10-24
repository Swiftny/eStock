import type { NextRequest } from "next/server";
import {
  clearedSessionResponse,
  currentRole,
  requireRole,
  sessionResponse,
  signIn,
  signOut,
  type Role,
} from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin, str } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const role = await currentRole(request);
    return json(role ? { authenticated: true, role } : { authenticated: false });
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const body = await readJson(request, 2048);
    if (body.role !== "manager" && body.role !== "staff")
      return json({ error: "Choose Manager or Staff.", code: "INVALID_ROLE" }, 400);
    const role = body.role as Role;
    const password = str(body.password, "Password", 256);
    const token = await signIn(role, password);
    return sessionResponse(role, token);
  } catch (error) {
    return respondError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireRole(request);
    await signOut(request);
    return clearedSessionResponse();
  } catch (error) {
    return respondError(error);
  }
}
