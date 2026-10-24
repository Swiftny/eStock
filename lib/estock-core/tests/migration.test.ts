import assert from "node:assert/strict";
import { test } from "node:test";
import { readCookie } from "../src/server/cookies.ts";
import { sameOrigin } from "../src/server/estock/input.ts";
import { clearedSessionResponse, currentRole } from "../src/server/estock/auth.ts";
import { json, respondError, EstockError } from "../src/server/estock/errors.ts";
import { rankProductMatches } from "../src/estock-product-match.ts";

test("cookies use exact names, decoding, and reject malformed encodings", () => {
  const request = new Request("https://example.test/api/estock/session", {
    headers: { cookie: "another=1; estock-session=abc%2B123; estock-session-extra=no" },
  });
  assert.equal(readCookie(request, "estock-session"), "abc+123");
  assert.equal(readCookie(request, "absent"), undefined);
  assert.equal(readCookie(new Request(request.url, { headers: { cookie: "x=%ZZ" } }), "x"), undefined);
});

test("same-origin mutations remain allowed; cross-site mutations are denied", () => {
  assert.doesNotThrow(() => sameOrigin(new Request("https://example.test/api/estock/products", {
    headers: { host: "example.test", origin: "https://example.test" },
  })));
  assert.throws(() => sameOrigin(new Request("https://example.test/api/estock/products", {
    headers: { host: "example.test", origin: "https://attacker.test" },
  })), /Cross-origin/);
  assert.throws(() => sameOrigin(new Request("https://example.test/api/estock/products", {
    headers: { "sec-fetch-site": "cross-site" },
  })), /Cross-site/);
});

test("signed-out requests do not need credentials or a database", async () => {
  assert.equal(await currentRole(new Request("https://example.test/api/estock/session")), null);
});

test("sign-out expires the HttpOnly session cookie and prevents caching", async () => {
  const response = clearedSessionResponse();
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.match(response.headers.get("set-cookie")!, /estock-session=; Path=\/; HttpOnly; SameSite=Strict; Max-Age=0/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("Fetch response status, error contracts, and no-store survive conversion", async () => {
  const created = json({ id: "test" }, 201);
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { id: "test" });
  const error = respondError(new EstockError("Sign in to continue.", 401, "UNAUTHENTICATED"));
  assert.equal(error.status, 401);
  assert.deepEqual(await error.json(), { error: "Sign in to continue.", code: "UNAUTHENTICATED" });
});

test("original product matching is available from the shared package", () => {
  assert.equal(typeof rankProductMatches, "function");
});
