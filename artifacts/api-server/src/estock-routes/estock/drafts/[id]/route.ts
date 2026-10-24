type NextRequest = Request;
import { requireRole } from "@/lib/server/estock/auth";
import { getDraft, saveDraft } from "@/lib/server/estock/drafts";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, "manager");
    const { id } = await context.params;
    return json({ draft: await getDraft(id) });
  } catch (error) {
    return respondError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    const { id } = await context.params;
    return json(await saveDraft(id, await readJson(request, 65_536)));
  } catch (error) {
    return respondError(error);
  }
}
