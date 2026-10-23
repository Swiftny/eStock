import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";
import { editProduct } from "@/lib/server/estock/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    const { id } = await context.params;
    return json(await editProduct(id, await readJson(request)));
  } catch (error) {
    return respondError(error);
  }
}
