import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";
import { confirmReceipt } from "@/lib/server/estock/receiving";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requireRole(request, "staff");
    const { id } = await context.params;
    return json(await confirmReceipt(id, await readJson(request)));
  } catch (error) {
    return respondError(error);
  }
}
