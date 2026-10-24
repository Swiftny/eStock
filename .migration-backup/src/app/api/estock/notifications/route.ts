import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { fail, json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";
import { clearNotifications, listNotifications } from "@/lib/server/estock/receiving";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(request);
    return json(await listNotifications(role));
  } catch (error) {
    return respondError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    const role = await requireRole(request);
    const input = await readJson(request, 1024);
    if (input.confirmation !== "Clear Notifications")
      fail('Type "Clear Notifications" exactly to continue.', 400, "CONFIRMATION_REQUIRED");
    return json(await clearNotifications(role));
  } catch (error) {
    return respondError(error);
  }
}
