import type { NextRequest } from "next/server";
import { endDemoDay, nextDemoDay, resetDemo } from "@/lib/server/service";
import { checkOrigin, sessionRole } from "@/lib/server/session";
import { DomainError, fail } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const role = sessionRole(request.cookies.get("estock-demo-session")?.value);
    const raw = await request.text();
    if (raw.length > 8000) fail("Demo control request is too large.", 413);
    let body: { action: string; input: Record<string, unknown>; key: string };
    try {
      body = JSON.parse(raw);
    } catch {
      fail("Request must contain valid JSON.", 400);
    }
    if (!body?.input || typeof body.input !== "object" || Array.isArray(body.input))
      fail("Demo control input is required.", 400);
    if (body.input.organisationId && body.input.organisationId !== "synthetic-estock")
      fail("Demo controls cannot change another workspace.", 403);
    const result =
      body.action === "reset"
        ? resetDemo(role, body.input, body.key)
        : body.action === "endDay"
          ? await endDemoDay(role, body.input)
          : body.action === "nextDay"
            ? nextDemoDay(role, body.input)
            : fail("Choose a valid demo control.", 400);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof DomainError))
      console.error("Demo control failed:", error instanceof Error ? error.name : "unknown");
    return Response.json(
      {
        error:
          error instanceof DomainError ? error.message : "Could not update the demo. Try again.",
        code: error instanceof DomainError ? error.code : "SERVER_ERROR",
      },
      {
        status: error instanceof DomainError ? error.status : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
