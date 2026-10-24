type NextRequest = Request;
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { sameOrigin } from "@/lib/server/estock/input";
import { readNotification } from "@/lib/server/estock/receiving";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const role = await requireRole(request);
    const { id } = await context.params;
    return json(await readNotification(id, role));
  } catch (error) {
    return respondError(error);
  }
}
