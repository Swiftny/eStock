export class EstockError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "INVALID_INPUT",
  ) {
    super(message);
  }
}

export function fail(message: string, status = 400, code = "INVALID_INPUT"): never {
  throw new EstockError(message, status, code);
}

export function respondError(error: unknown): Response {
  if (!(error instanceof EstockError)) {
    console.error("eStock request failed:", error instanceof Error ? error.name : "unknown");
  }
  return Response.json(
    {
      error: error instanceof EstockError ? error.message : "Could not complete this request.",
      code: error instanceof EstockError ? error.code : "SERVER_ERROR",
    },
    {
      status: error instanceof EstockError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}
