import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { listHistory } from "@/lib/server/estock/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "manager");
    return json({ movements: await listHistory() });
  } catch (error) {
    return respondError(error);
  }
}
