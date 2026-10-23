import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { getReceipt } from "@/lib/server/estock/receiving";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const role = await requireRole(request);
    const { id } = await context.params;
    return json({ receipt: await getReceipt(id, role) });
  } catch (error) {
    return respondError(error);
  }
}
