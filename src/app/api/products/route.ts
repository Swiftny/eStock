import type { NextRequest } from "next/server";
import { inventoryError, inventoryJson, inventorySession } from "@/lib/server/inventory/http";
import { inventoryProducts } from "@/lib/server/inventory/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    return inventoryJson(inventoryProducts(inventorySession(request)));
  } catch (error) {
    return inventoryError(error);
  }
}
