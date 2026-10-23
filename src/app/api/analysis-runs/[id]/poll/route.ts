/** Legacy forecast/purchasing endpoint retired after the eStock document-intake pivot. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function retired() {
  return Response.json(
    { error: "This legacy demo endpoint is retired. Use /api/estock.", code: "LEGACY_RETIRED" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = retired;
export const POST = retired;
export const PATCH = retired;
export const DELETE = retired;
