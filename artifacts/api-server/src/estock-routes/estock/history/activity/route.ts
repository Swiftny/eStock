type NextRequest = Request;
import { requireRole } from "@/lib/server/estock/auth";
import { fail, json, respondError } from "@/lib/server/estock/errors";
import { clearStockActivity } from "@/lib/server/estock/history";
import { readJson, sameOrigin } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    const input = await readJson(request, 1024);
    if (input.confirmation !== "Clear Stock Activity")
      fail('Type "Clear Stock Activity" exactly to continue.', 400, "CONFIRMATION_REQUIRED");
    return json(await clearStockActivity());
  } catch (error) {
    return respondError(error);
  }
}
