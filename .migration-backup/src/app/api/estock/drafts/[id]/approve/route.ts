import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { approveDraft } from "@/lib/server/estock/drafts";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    const { id } = await context.params;
    return json(await approveDraft(id, await readJson(request)));
  } catch (error) {
    return respondError(error);
  }
}
