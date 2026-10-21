import type { NextRequest } from "next/server";
import type { InventoryMovementQuery } from "@/lib/inventory/contracts";
import {
  inventoryError,
  inventoryJson,
  inventorySession,
  readMovementBody,
} from "@/lib/server/inventory/http";
import { recordStockMovement } from "@/lib/server/inventory/mutations";
import { inventoryMovements } from "@/lib/server/inventory/queries";
import { checkOrigin } from "@/lib/server/session";
import { text } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    const role = inventorySession(request);
    const parameters = new URL(request.url).searchParams;
    const query: InventoryMovementQuery = {};
    if (parameters.has("productId")) query.productId = parameters.get("productId") ?? "";
    if (parameters.has("limit")) query.limit = Number(parameters.get("limit"));
    if (parameters.has("cursor")) query.cursor = parameters.get("cursor") ?? "";
    return inventoryJson(inventoryMovements(role, query));
  } catch (error) {
    return inventoryError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const role = inventorySession(request);
    const key = text(request.headers.get("Idempotency-Key"), "Idempotency-Key", 160);
    const input = await readMovementBody(request);
    return inventoryJson(recordStockMovement(role, input, key));
  } catch (error) {
    return inventoryError(error);
  }
}
