import { readCookie } from "../cookies";
import { readJsonObject } from "../json.ts";
import { checkOrigin, sessionRole } from "../session.ts";
import { DomainError, text } from "../validation.ts";

export function forecastSession(request: Request) {
  return sessionRole(readCookie(request, "estock-demo-session"));
}

export function forecastJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function forecastError(error: unknown) {
  const known = error instanceof DomainError;
  if (!known)
    console.error("Forecast operation failed:", error instanceof Error ? error.name : "unknown");
  return forecastJson(
    {
      error: known ? error.message : "Could not complete the forecast operation. Try again.",
      code: known ? error.code : "SERVER_ERROR",
    },
    known ? error.status : 500,
  );
}

export async function forecastMutationRequest(request: Request) {
  checkOrigin(request);
  const role = forecastSession(request);
  const key = text(request.headers.get("Idempotency-Key"), "Idempotency-Key", 160);
  const input = await readJsonObject(request, "Forecast");
  return { role, key, input };
}
