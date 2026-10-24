import { fail } from "./validation.ts";

export async function readJsonObject(request: Request, label: string) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    fail(`Send ${label.toLowerCase()} requests as application/json.`, 415, "CONTENT_TYPE");
  if (!request.body) fail("Send a JSON object.", 400, "INVALID_JSON");
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
        fail(`${label} requests must be 16 KiB or smaller.`, 413, "BODY_TOO_LARGE");
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
    fail("Send a JSON object.", 400, "INVALID_JSON");
  return body as Record<string, unknown>;
}
