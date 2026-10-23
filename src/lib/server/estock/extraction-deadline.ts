import { fail } from "./errors";

export const EXTRACTION_TIMEOUT_MS = 45_000;

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
    fail(
      "Gemini could not read this image. No draft was saved and stock has not changed. Check the image and try Create draft again.",
      502,
      "GEMINI_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timer);
  }
}
