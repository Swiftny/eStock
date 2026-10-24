import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { listReceiving } from "@/lib/server/estock/receiving";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(request);
    return json({ receipts: await listReceiving(role) });
  } catch (error) {
    return respondError(error);
  }
}
