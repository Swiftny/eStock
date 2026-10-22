import type { NextRequest } from "next/server";
import type { ActionName } from "@/lib/contracts";
import { act } from "@/lib/server/service";
import { checkOrigin, sessionRole } from "@/lib/server/session";
import { state } from "@/lib/server/store";
import { DomainError, fail } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function respondError(error: unknown) {
  if (!(error instanceof DomainError))
    console.error("Demo operation failed:", error instanceof Error ? error.name : "unknown");
  return Response.json(
    {
      error:
        error instanceof DomainError
          ? error.message
          : "Could not save this operation. Your input is preserved; try again.",
      code: error instanceof DomainError ? error.code : "SERVER_ERROR",
    },
    {
      status: error instanceof DomainError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function GET(request: NextRequest) {
  try {
    return Response.json(state(sessionRole(request.cookies.get("estock-demo-session")?.value)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return respondError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const role = sessionRole(request.cookies.get("estock-demo-session")?.value);
    const raw = await request.text();
    if (raw.length > 550000) fail("Request is too large.", 413);
    let body: { action: ActionName; input: Record<string, unknown>; key: string };
    try {
      body = JSON.parse(raw);
    } catch {
      fail("Request must contain valid JSON.", 400);
    }
    if (!body?.input || typeof body.input !== "object" || Array.isArray(body.input))
      fail("Action input must be an object.", 400);
    return Response.json(await act(role, body.action, body.input, body.key), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return respondError(error);
  }
}
