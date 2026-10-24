import { fail } from "./errors";

const RETRY_503_DELAY_MS = 1_000;

function providerHttpStatus(error: unknown): number | null {
  return error instanceof Error && "status" in error && typeof error.status === "number"
    ? error.status
    : null;
}

function providerFailure(error: unknown): never {
  const status = providerHttpStatus(error);
  let reason: string | undefined;
  let providerStatus: string | undefined;
  if (error instanceof Error && status !== null) {
    try {
      const body = JSON.parse(error.message)?.error;
      providerStatus = body?.status;
      reason = body?.details?.find(
        (detail: { reason?: unknown }) =>
          detail?.reason === "API_KEY_INVALID" || detail?.reason === "API_KEY_EXPIRED",
      )?.reason;
    } catch {
      // Provider error bodies are optional and never returned or logged.
    }
  }
  const unchanged = " No draft was saved and stock has not changed.";
  const timeoutName =
    error instanceof Error &&
    ["TimeoutError", "AbortError", "RequestTimeoutError", "APIConnectionTimeoutError"].includes(
      error.name,
    );
  if (status === 408 || status === 504 || timeoutName) {
    fail(
      `Gemini or the connection timed out. Try Create draft again when you are ready.${unchanged}`,
      504,
      "GEMINI_TIMEOUT",
    );
  }
  if (status === 401 || reason) {
    fail(
      `Gemini could not authenticate the server API key. Check GEMINI_API_KEY in .env.local.${unchanged}`,
      502,
      "GEMINI_AUTH_ERROR",
    );
  }
  if (status === 403) {
    fail(
      `Gemini denied access. Check the API key's permissions and restrictions in Google AI Studio.${unchanged}`,
      502,
      "GEMINI_PERMISSION_DENIED",
    );
  }
  if (status === 402) {
    fail(
      `Gemini reports that this account has no remaining credits. Check the account in Google AI Studio.${unchanged}`,
      502,
      "GEMINI_CREDITS_EXHAUSTED",
    );
  }
  if (status === 429) {
    fail(
      `Gemini's rate limit or quota was reached. Check usage in Google AI Studio before trying again.${unchanged}`,
      429,
      "GEMINI_RATE_LIMITED",
    );
  }
  if (status === 404) {
    fail(
      `The configured Gemini model is unavailable. Check ESTOCK_GEMINI_MODEL and model access.${unchanged}`,
      502,
      "GEMINI_MODEL_UNAVAILABLE",
    );
  }
  if (status === 400 && providerStatus === "FAILED_PRECONDITION") {
    fail(
      `Gemini is unavailable for this project's current setup. Check account and region availability in Google AI Studio.${unchanged}`,
      502,
      "GEMINI_PRECONDITION_FAILED",
    );
  }
  if (status === 400) {
    fail(
      `Gemini rejected the scan request. Check the server's model and extraction settings.${unchanged}`,
      502,
      "GEMINI_INVALID_REQUEST",
    );
  }
  fail(
    status === 500 || status === 503
      ? `Gemini is temporarily unavailable. Try Create draft again later.${unchanged}`
      : `The Gemini request failed. Check the server connection and try Create draft again.${unchanged}`,
    502,
    "GEMINI_UNAVAILABLE",
  );
}

export async function withExtractionProviderErrors<T>(operation: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  let attempts = 0;
  for (;;) {
    attempts++;
    try {
      return await operation();
    } catch (error) {
      const status = providerHttpStatus(error);
      if (status === 503 && attempts === 1) {
        console.warn("eStock Gemini provider retry", {
          status: 503,
          nextAttempt: 2,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
        await new Promise((resolve) => setTimeout(resolve, RETRY_503_DELAY_MS));
        continue;
      }
      const name = error instanceof Error ? error.name : "unknown";
      const errorClass = [
        "ApiError",
        "AbortError",
        "TimeoutError",
        "RequestTimeoutError",
        "APIConnectionTimeoutError",
        "TypeError",
        "Error",
      ].includes(name)
        ? name
        : "other";
      console.error("eStock Gemini provider failure", {
        errorClass,
        status:
          status !== null && Number.isInteger(status) && status >= 100 && status <= 599
            ? status
            : null,
        attempts,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      providerFailure(error);
    }
  }
}
