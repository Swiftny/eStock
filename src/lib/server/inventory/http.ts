import type { NextRequest } from "next/server";
import type { InventoryErrorResponse } from "../../inventory/contracts.ts";
import { readJsonObject } from "../json.ts";
import { sessionRole } from "../session.ts";
import { DomainError } from "../validation.ts";

export function inventorySession(request: NextRequest) {
  return sessionRole(request.cookies.get("estock-demo-session")?.value);
}

export function inventoryJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function inventoryError(error: unknown) {
  const known = error instanceof DomainError;
  if (!known)
    console.error("Inventory operation failed:", error instanceof Error ? error.name : "unknown");
  const body: InventoryErrorResponse = {
    error: known ? error.message : "Could not complete the stock operation. Try again.",
    code: known ? error.code : "SERVER_ERROR",
  };
  return inventoryJson(body, known ? error.status : 500);
}

export async function readMovementBody(request: Request): Promise<Record<string, unknown>> {
  return readJsonObject(request, "Stock movement");
}
