import { createHash } from "node:crypto";
import { fail } from "./errors";

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Send a JSON object.");
  return value as Record<string, unknown>;
}

export async function readJson(
  request: Request,
  maxBytes = 32_768,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  ) {
    fail("Send application/json.", 415, "CONTENT_TYPE");
  }
  const reader = request.body?.getReader();
  if (!reader) fail("Send a JSON object.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) fail("Request is too large.", 413, "BODY_TOO_LARGE");
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return object(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    fail("Request must contain valid JSON.", 400, "INVALID_JSON");
  }
}

export function str(value: unknown, label: string, max = 120): string {
  if (typeof value !== "string") fail(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) fail(`${label} must have 1–${max} characters.`);
  return trimmed;
}

export function optionalStr(value: unknown, label: string, max = 120): string | null {
  if (value === null || value === undefined || value === "") return null;
  return str(value, label, max);
}

export function integer(value: unknown, label: string, min = 1): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) {
    fail(`${label} must be a ${min === 0 ? "nonnegative" : "positive"} whole number.`);
  }
  return value;
}

export function revision(value: unknown): number {
  return integer(value, "Expected revision");
}

export function id(value: unknown, label = "ID"): string {
  const result = str(value, label, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result)) {
    fail(`${label} is invalid.`);
  }
  return result;
}

export function requestId(value: unknown): string {
  const result = str(value, "Request ID", 160);
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(result)) fail("Request ID is invalid.");
  return result;
}

export function dateOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const result = str(value, "Document date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(`${result}T00:00:00Z`))) {
    fail("Document date must be YYYY-MM-DD.");
  }
  const parsed = new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10);
  if (parsed !== result) fail("Document date is invalid.");
  return result;
}

export function dateOnly(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  return String(value).slice(0, 10);
}

export function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function sameOrigin(request: Request): void {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    fail("Cross-site request denied.", 403, "FORBIDDEN");
  const origin = request.headers.get("origin");
  if (origin) {
    let parsed: URL;
    let expectedOrigin: string;
    try {
      parsed = new URL(origin);
      const target = new URL(request.url);
      const host = request.headers.get("host");
      // Next.js may construct request.url from the bind address (0.0.0.0).
      // Host carries the requested authority, including its port. Do not trust
      // an arbitrary forwarded host or allow a different browser origin.
      if (host && /[\\/?#@,\s]/.test(host)) throw new Error("Invalid request host");
      expectedOrigin = host ? new URL(`${target.protocol}//${host}`).origin : target.origin;
    } catch {
      fail("Cross-origin request denied.", 403, "FORBIDDEN");
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      parsed.origin !== expectedOrigin
    )
      fail("Cross-origin request denied.", 403, "FORBIDDEN");
  }
}
