import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { createDraft, listDrafts } from "@/lib/server/estock/drafts";
import { json, respondError } from "@/lib/server/estock/errors";
import { sameOrigin } from "@/lib/server/estock/input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "manager");
    return json({ drafts: await listDrafts() });
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    return json(await createDraft(request), 201);
  } catch (error) {
    return respondError(error);
  }
}
