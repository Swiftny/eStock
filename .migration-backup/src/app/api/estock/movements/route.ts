import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";
import { recordMovement } from "@/lib/server/estock/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const role = await requireRole(request);
    return json(await recordMovement(role, await readJson(request)), 201);
  } catch (error) {
    return respondError(error);
  }
}
