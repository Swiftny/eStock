import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/estock/auth";
import { json, respondError } from "@/lib/server/estock/errors";
import { readJson, sameOrigin } from "@/lib/server/estock/input";
import { createProduct, listProducts } from "@/lib/server/estock/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const role = await requireRole(request);
    return json({
      role,
      products: await listProducts(new URL(request.url).searchParams.get("q") || ""),
    });
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await requireRole(request, "manager");
    return json(await createProduct(await readJson(request)), 201);
  } catch (error) {
    return respondError(error);
  }
}
