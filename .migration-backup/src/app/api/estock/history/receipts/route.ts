import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { fail, json, respondError } from "@/lib/server/estock/errors";
import { clearReceiptHistory } from "@/lib/server/estock/history";
import { readJson, sameOrigin } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    const input = await readJson(request, 1024);
    if (input.confirmation !== "Clear History")
      fail('Type "Clear History" exactly to delete receipt history.', 400, "CONFIRMATION_REQUIRED");
    return json(await clearReceiptHistory());
  } catch (error) {
    return respondError(error);
  }
}
