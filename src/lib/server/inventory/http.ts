import type { NextRequest } from "next/server";
import type { InventoryErrorResponse } from "../../inventory/contracts.ts";
import { sessionRole } from "../session.ts";
import { DomainError, fail } from "../validation.ts";

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
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    fail("Send stock movements as application/json.", 415, "CONTENT_TYPE");
  if (!request.body) fail("Send a stock movement as a JSON object.", 400, "INVALID_JSON");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 16_384) {
        await reader.cancel();
        fail("Stock movement requests must be 16 KiB or smaller.", 413, "BODY_TOO_LARGE");
      }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    fail("Request must contain valid JSON.", 400, "INVALID_JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail("Send a stock movement as a JSON object.", 400, "INVALID_JSON");
  return body as Record<string, unknown>;
}
