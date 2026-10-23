import { fail } from "./errors";

export const EXTRACTION_TIMEOUT_MS = 45_000;

function providerFailure(error: unknown): never {
  const status =
    error instanceof Error && "status" in error && typeof error.status === "number"
      ? error.status
      : null;
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

export async function withExtractionDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = EXTRACTION_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new DOMException("Extraction deadline reached", "TimeoutError"));
        }, timeoutMs);
      }),
      operation(controller.signal),
    ]);
  } catch (error) {
    if (controller.signal.aborted || (error instanceof Error && error.name === "TimeoutError")) {
      fail(
        "Reading the image took too long. No draft was saved and stock has not changed. Try Create draft again when you are ready.",
        504,
        "GEMINI_TIMEOUT",
      );
    }
    providerFailure(error);
  } finally {
    clearTimeout(timer);
  }
}
