import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { registerHooks, createRequire } from "node:module";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = process.cwd();
const require = createRequire(pathToFileURL(resolve(root, "package.json")));
const pg = require("pg");
if (existsSync(resolve(root, ".env.local"))) process.loadEnvFile(resolve(root, ".env.local"));
process.env.DATABASE_URL = process.env.ESTOCK_TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "undefined")
  throw new Error("Set ESTOCK_TEST_DATABASE_URL or DATABASE_URL for isolated PostgreSQL tests.");
const control = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const schema = `estock_audit_${randomBytes(8).toString("hex")}`;
assert.match(schema, /^estock_audit_[a-f0-9]{16}$/);
let created = false;
let pool;
let passed = 0;
let failed = 0;
let providerCalls = 0;
const key = () => `audit:${randomUUID()}`;
const date = "2026-10-23";
globalThis.__auditExtraction = { documentDate: date, lines: [] };
const provider = `export const Type={OBJECT:'OBJECT',ARRAY:'ARRAY',STRING:'STRING',BOOLEAN:'BOOLEAN'}; export class GoogleGenAI { constructor(options){globalThis.__auditSdkOptions=options;} models={generateContent:async(input)=>{globalThis.__auditSdkInput=input;return globalThis.__auditProvider();}}; }`;
globalThis.__auditProvider = async () => {
  providerCalls++;
  if (globalThis.__auditExtraction instanceof Error) throw globalThis.__auditExtraction;
  return {
    text:
      typeof globalThis.__auditExtraction === "string"
        ? globalThis.__auditExtraction
        : JSON.stringify(globalThis.__auditExtraction),
  };
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@google/genai")
      return { url: `data:text/javascript,${encodeURIComponent(provider)}`, shortCircuit: true };
    if (specifier === "next/server")
      return { url: pathToFileURL(require.resolve("next/server.js")).href, shortCircuit: true };
    let path;
    if (specifier.startsWith("@/")) path = resolve(root, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))
      path = fileURLToPath(new URL(specifier, context.parentURL));
    if (path && existsSync(`${path}.ts`))
      return { url: pathToFileURL(`${path}.ts`).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
async function check(name, operation) {
  await test(name, async () => {
    try {
      await operation();
      passed++;
    } catch (error) {
      failed++;
      throw error;
    }
  });
}
async function rejected(operation, code) {
  await assert.rejects(operation, (error) => error.code === code);
}
try {
  await control.connect();
  await control.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  const isolated = new URL(process.env.DATABASE_URL);
  isolated.searchParams.set("options", `-c search_path=${schema}`);
  process.env.DATABASE_URL = isolated.href;
  process.env.GEMINI_API_KEY = "synthetic-audit-provider-stub";
  process.env.NODE_ENV = "development";
  process.env.ESTOCK_MANAGER_PASSWORD = randomBytes(24).toString("base64url");
  process.env.ESTOCK_STAFF_PASSWORD = process.env.ESTOCK_MANAGER_PASSWORD;
  process.env.ESTOCK_SESSION_SECRET = randomBytes(48).toString("base64url");
  process.env.ESTOCK_DEMO_ALLOW_SHARED_PASSWORD = "true";
  const load = (path) => import(pathToFileURL(resolve(root, path)).href);
  const db = await load("src/lib/server/estock/db.ts");
  pool = db.getPool();
  assert.equal((await pool.query("SELECT current_schema() AS name")).rows[0].name, schema);
  await db.ready();
  const inv = await load("src/lib/server/estock/inventory.ts");
  const drafts = await load("src/lib/server/estock/drafts.ts");
  const receiving = await load("src/lib/server/estock/receiving.ts");
  const input = await load("src/lib/server/estock/input.ts");
  const auth = await load("src/lib/server/estock/auth.ts");
  const { NextRequest } = await import("next/server");
  const product = async (name, stock = 0) =>
    (await inv.createProduct({ name, unit: "pcs", openingStock: stock, requestId: key() })).product;
  const imageRequest = (
    file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])], "synthetic.png", {
      type: "image/png",
    }),
  ) => {
    const form = new FormData();
    form.append("image", file);
    return new Request("http://localhost:3000/api/estock/drafts", { method: "POST", body: form });
  };
  const newDraft = async (lines, documentDate = date) => {
    globalThis.__auditExtraction = { documentDate, lines };
    return (await drafts.createDraft(imageRequest())).draft;
  };
  const line = (rawName, rawQuantity = "1", rawUnit = "pcs") => ({
    rawName,
    rawQuantity,
    rawUnit,
    needsReview: false,
  });
  const edits = (draft) =>
    draft.lines.map((item) => ({
      id: item.id,
      reviewedName: item.reviewedName,
      productId: item.productId,
      approvedQuantity: item.approvedQuantity,
      excluded: false,
      exclusionReason: null,
      confirmAlias: false,
    }));
  const save = async (draft, lines = edits(draft)) =>
    (
      await drafts.saveDraft(draft.id, {
        expectedRevision: draft.revision,
        documentDate: draft.documentDate,
        lines,
      })
    ).draft;
  const send = (draft, requestId = key()) =>
    receiving.sendReceipt(draft.id, { expectedRevision: draft.revision, requestId });
  const confirm = (
    receipt,
    lines = receipt.lines.map((l) => ({ id: l.id, outcome: "MATCH" })),
    requestId = key(),
  ) =>
    receiving.confirmReceipt(receipt.id, {
      expectedRevision: receipt.revision,
      confirmReceived: true,
      lines,
      requestId,
    });
  const complete = async (draft, requestId = key()) => {
    const sent = await send(draft, `send:${requestId}`);
    const snapshot = await receiving.getReceipt(draft.id, "staff");
    await receiving.confirmReceipt(draft.id, {
      expectedRevision: sent.draft.revision,
      confirmReceived: true,
      lines: snapshot.lines.map((l) => ({ id: l.id, outcome: "MATCH" })),
      requestId,
    });
    return {
      draft: await drafts.getDraft(draft.id),
      movements: (await inv.listHistory())
        .filter((m) => m.draftId === draft.id)
        .sort((a, b) => a.lineOrder - b.lineOrder),
    };
  };
  let base;
  await check("empty startup; one product and Opening on retried creation", async () => {
    assert.equal((await inv.listProducts()).length, 0);
    const payload = { name: "Synthetic Widget", unit: "pcs", openingStock: 7, requestId: key() };
    const first = await inv.createProduct(payload);
    const second = await inv.createProduct(payload);
    base = first.product;
    assert.equal(second.product.id, base.id);
    assert.equal(base.stock, 7);
    assert.equal((await inv.listHistory()).length, 1);
    await rejected(() => inv.createProduct({ ...payload, openingStock: 8 }), "REQUEST_CONFLICT");
    for (const openingStock of [-1, 0.5])
      await rejected(
        () => inv.createProduct({ ...payload, openingStock, requestId: key() }),
        "INVALID_INPUT",
      );
  });
  await check("low stock strictly below 5; case-insensitive search", async () => {
    for (const n of [0, 4, 5, 6]) {
      const p = await product(`Threshold ${n}`, n);
      assert.equal(p.lowStock, n < 5);
    }
    assert.equal((await inv.listProducts("sYnThEtIc WiDgEt"))[0].id, base.id);
  });
  await check("confirmed exact alias, collision and partial-name matching", async () => {
    const other = await product("Synthetic Variant XL");
    let draft = await newDraft([line("Synthetic Widget")]);
    assert.equal(draft.lines[0].productId, base.id);
    await save(draft, [
      {
        ...edits(draft)[0],
        reviewedName: "Shared Supplier Alias",
        productId: base.id,
        confirmAlias: true,
      },
    ]);
    assert.equal((await inv.matchExactProducts("shared SUPPLIER alias"))[0].id, base.id);
    assert.equal((await inv.listProducts("SUPPLIER"))[0].id, base.id);
    draft = await newDraft([line("Synthetic Variant XL")]);
    await save(draft, [
      {
        ...edits(draft)[0],
        reviewedName: "Shared Supplier Alias",
        productId: other.id,
        confirmAlias: true,
      },
    ]);
    assert.equal((await inv.matchExactProducts("Shared Supplier Alias")).length, 2);
    assert.equal((await newDraft([line("Shared Supplier Alias")])).lines[0].productId, null);
    assert.equal((await newDraft([line("Synthetic")])).lines[0].productId, null);
  });
  await check(
    "unknown review product Opening 0; manual conversion; raw/final preservation",
    async () => {
      let draft = await newDraft([line("Unknown Carton", "2", "boxes")]);
      assert.equal(draft.lines[0].productId, null);
      assert.equal(draft.lines[0].approvedQuantity, null);
      const p = await product("New Review Product", 0);
      draft = await save(draft, [
        {
          ...edits(draft)[0],
          productId: p.id,
          reviewedName: "Reviewed Carton",
          approvedQuantity: 24,
        },
      ]);
      assert.equal((await inv.getProduct(p.id)).stock, 0);
      await rejected(
        () =>
          receiving.confirmReceipt(draft.id, {
            expectedRevision: draft.revision,
            confirmReceived: false,
            requestId: key(),
            lines: [],
          }),
        "INVALID_INPUT",
      );
      await complete(draft);
      assert.equal((await inv.getProduct(p.id)).stock, 24);
      const movement = (await inv.listHistory()).find(
        (item) => item.productId === p.id && item.type === "INTAKE",
      );
      assert.equal(movement.rawQuantity, 2);
      assert.equal(movement.rawUnit, "boxes");
      assert.equal(movement.quantity, 24);
      assert.equal(movement.unit, "pcs");
      assert.equal(movement.reviewedName, "Reviewed Carton");
    },
  );
  await check("atomic multi-line receiving; immutable terminal draft; request replay", async () => {
    const before = (await inv.getProduct(base.id)).stock;
    const draft = await newDraft([line(base.name, "2"), line(base.name, "3")], "2026-10-01");
    assert.equal((await inv.getProduct(base.id)).stock, before);
    const requestId = key();
    const result = await complete(draft, requestId);
    assert.equal((await inv.getProduct(base.id)).stock, before + 5);
    assert.equal(result.movements.length, 2);
    assert.equal(result.movements[0].documentDate, "2026-10-01");
    assert.ok(
      result.movements.every(
        (x) => Number.isFinite(Date.parse(x.createdAt)) && !x.approvedAt && x.actorRole === "staff",
      ),
    );
    const replay = await complete(draft, requestId);
    assert.equal(replay.draft.id, draft.id);
    assert.equal((await inv.getProduct(base.id)).stock, before + 5);
    await rejected(
      () =>
        receiving.confirmReceipt(draft.id, {
          expectedRevision: draft.revision + 2,
          confirmReceived: true,
          requestId,
          lines: draft.lines.map((l) => ({ id: l.id, outcome: "MATCH" })),
        }),
      "REQUEST_CONFLICT",
    );
    await rejected(() => complete(draft), "DRAFT_CLOSED");
    await rejected(() => save(result.draft), "DRAFT_CLOSED");
    await rejected(
      () => drafts.discardDraft(draft.id, { expectedRevision: result.draft.revision }),
      "STALE_DRAFT",
    );
    const warning = await newDraft([line(base.name, "3"), line(base.name, "2")], "2026-10-01");
    assert.ok(warning.similarDocumentWarning);
  });
  await check("failure on second Intake rolls back every line/balance/status/request", async () => {
    const p = await product("Rollback Product");
    let draft = await newDraft([line(p.name, "2"), line(p.name, "3")]);
    const values = edits(draft);
    values[1].reviewedName = "FAIL_ME";
    draft = await save(draft, values);
    const requestId = key();
    await pool.query(
      "CREATE FUNCTION audit_fail_line() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.type='INTAKE' AND NEW.reviewed_name='FAIL_ME' THEN RAISE EXCEPTION 'synthetic injected failure'; END IF; RETURN NEW; END $$",
    );
    await pool.query(
      "CREATE TRIGGER audit_fail_line BEFORE INSERT ON estock_movements FOR EACH ROW EXECUTE FUNCTION audit_fail_line()",
    );
    await assert.rejects(() => complete(draft, requestId));
    assert.equal((await inv.getProduct(p.id)).stock, 0);
    assert.equal((await drafts.getDraft(draft.id)).status, "AWAITING_STAFF");
    assert.equal(
      (
        await pool.query("SELECT count(*)::int AS n FROM estock_movements WHERE draft_id=$1", [
          draft.id,
        ])
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await pool.query("SELECT count(*)::int AS n FROM estock_requests WHERE request_id=$1", [
          requestId,
        ])
      ).rows[0].n,
      0,
    );
    await pool.query("DROP TRIGGER audit_fail_line ON estock_movements");
    await pool.query("DROP FUNCTION audit_fail_line()");
    await complete(draft, requestId);
    assert.equal((await inv.getProduct(p.id)).stock, 5);
    const left = await product("Balance Rollback A");
    const right = await product("Balance Rollback B");
    const balanceDraft = await newDraft([line(left.name), line(right.name)]);
    const balanceKey = key();
    const lastProduct = [left.id, right.id].sort().at(-1);
    await pool.query(
      "CREATE FUNCTION audit_fail_balance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id::text=TG_ARGV[0] AND NEW.stock>0 THEN RAISE EXCEPTION 'synthetic balance failure'; END IF; RETURN NEW; END $$",
    );
    await pool.query(
      `CREATE TRIGGER audit_fail_balance AFTER UPDATE OF stock ON estock_products FOR EACH ROW EXECUTE FUNCTION audit_fail_balance('${lastProduct}')`,
    );
    await assert.rejects(() => complete(balanceDraft, balanceKey));
    for (const selected of [left, right])
      assert.equal((await inv.getProduct(selected.id)).stock, 0);
    assert.equal((await drafts.getDraft(balanceDraft.id)).status, "AWAITING_STAFF");
    assert.equal(
      (
        await pool.query("SELECT count(*)::int AS n FROM estock_movements WHERE draft_id=$1", [
          balanceDraft.id,
        ])
      ).rows[0].n,
      0,
    );
    assert.equal(
      (
        await pool.query("SELECT count(*)::int AS n FROM estock_requests WHERE request_id=$1", [
          balanceKey,
        ])
      ).rows[0].n,
      0,
    );
    await pool.query("DROP TRIGGER audit_fail_balance ON estock_products");
    await pool.query("DROP FUNCTION audit_fail_balance()");
    await complete(balanceDraft, balanceKey);
    for (const selected of [left, right])
      assert.equal((await inv.getProduct(selected.id)).stock, 1);
  });
  await check(
    "concurrent Takes 4+4 against 5; persistent Return retry and validation",
    async () => {
      const p = await product("Concurrency Take Product", 5);
      const results = await Promise.allSettled(
        [1, 2].map(() =>
          inv.recordMovement("staff", {
            productId: p.id,
            type: "TAKE",
            quantity: 4,
            requestId: key(),
          }),
        ),
      );
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await inv.getProduct(p.id)).stock, 1);
      const payload = { productId: p.id, type: "RETURN", quantity: 2, requestId: key() };
      const first = await inv.recordMovement("staff", payload);
      const replay = await inv.recordMovement("staff", payload);
      assert.equal(first.movement.id, replay.movement.id);
      assert.equal((await inv.getProduct(p.id)).stock, 3);
      assert.equal(first.movement.actorAccountId, "staff");
      await rejected(
        () => inv.recordMovement("staff", { ...payload, quantity: 3 }),
        "REQUEST_CONFLICT",
      );
      for (const quantity of [0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])
        await rejected(
          () => inv.recordMovement("staff", { ...payload, requestId: key(), quantity }),
          "INVALID_INPUT",
        );
    },
  );
  await check("concurrent receiving; stale revision and catalogue edit detection", async () => {
    const p = await product("Concurrent Approval Product");
    let draft = await newDraft([line(p.name, "2")]);
    const results = await Promise.allSettled([complete(draft), complete(draft)]);
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await inv.getProduct(p.id)).stock, 2);
    draft = await newDraft([line(p.name, "1")]);
    const old = draft;
    draft = await save(draft);
    await rejected(() => complete(old), "STALE_DRAFT");
    await inv.editProduct(p.id, { name: "Renamed Synthetic Product", expectedVersion: p.version });
    await rejected(() => complete(draft), "STALE_PRODUCT");
    draft = await save(draft);
    await complete(draft);
    assert.equal((await inv.getProduct(p.id)).stock, 3);
    draft = await newDraft([line("Renamed Synthetic Product", "1")]);
    const race = await Promise.allSettled([save(draft), complete(draft)]);
    assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
    const afterRace = await drafts.getDraft(draft.id);
    assert.equal((await inv.getProduct(p.id)).stock, afterRace.status === "RECEIVED" ? 4 : 3);
  });
  await check(
    "discard persists with no stock; raw values survive corrected draft re-read",
    async () => {
      let draft = await newDraft([line(base.name, "1.5", "boxes")]);
      const before = (await inv.getProduct(base.id)).stock;
      draft = await save(draft, [
        { ...edits(draft)[0], reviewedName: "Corrected text", approvedQuantity: 12 },
      ]);
      const reread = await drafts.getDraft(draft.id);
      assert.equal(reread.lines[0].rawQuantity, 1.5);
      assert.equal(reread.lines[0].reviewedName, "Corrected text");
      await drafts.discardDraft(draft.id, { expectedRevision: draft.revision });
      assert.equal((await drafts.getDraft(draft.id)).status, "DISCARDED");
      assert.equal((await inv.getProduct(base.id)).stock, before);
      await rejected(() => complete(draft), "DRAFT_CLOSED");
    },
  );
  await check(
    "provider failures explain recovery without leaking provider data or saving drafts and stock",
    async () => {
      const { respondError } = await load("src/lib/server/estock/errors.ts");
      const count = (await pool.query("SELECT count(*)::int n FROM estock_drafts")).rows[0].n;
      const balance = (await inv.getProduct(base.id)).stock;
      const cases = [
        [400, "API_KEY_INVALID", "INVALID_ARGUMENT", "GEMINI_AUTH_ERROR", "API key"],
        [400, "API_KEY_EXPIRED", "INVALID_ARGUMENT", "GEMINI_AUTH_ERROR", "API key"],
        [401, null, "UNAUTHENTICATED", "GEMINI_AUTH_ERROR", "API key"],
        [403, null, "PERMISSION_DENIED", "GEMINI_PERMISSION_DENIED", "permissions"],
        [402, null, "RESOURCE_EXHAUSTED", "GEMINI_CREDITS_EXHAUSTED", "credits"],
        [429, null, "RESOURCE_EXHAUSTED", "GEMINI_RATE_LIMITED", "quota"],
        [404, null, "NOT_FOUND", "GEMINI_MODEL_UNAVAILABLE", "model"],
        [400, null, "FAILED_PRECONDITION", "GEMINI_PRECONDITION_FAILED", "account"],
        [400, null, "INVALID_ARGUMENT", "GEMINI_INVALID_REQUEST", "settings"],
        [500, null, "INTERNAL", "GEMINI_UNAVAILABLE", "temporarily unavailable"],
        [503, null, "UNAVAILABLE", "GEMINI_UNAVAILABLE", "temporarily unavailable"],
      ];
      for (const [status, reason, providerStatus, code, guidance] of cases) {
        globalThis.__auditExtraction = Object.assign(
          new Error(
            JSON.stringify({
              error: {
                status: providerStatus,
                message: "private-provider-key-and-document-text",
                details: [
                  { reason, metadata: { private: "private-provider-key-and-document-text" } },
                ],
              },
            }),
          ),
          { name: "ApiError", status },
        );
        try {
          await drafts.createDraft(imageRequest());
          assert.fail("Provider failure must not create a draft");
        } catch (error) {
          assert.equal(error.code, code);
          const response = respondError(error);
          assert.equal(response.status, status === 429 ? 429 : 502);
          assert.equal(response.headers.get("Cache-Control"), "no-store");
          const body = await response.json();
          assert.ok(body.error.includes(guidance));
          assert.ok(body.error.includes("No draft was saved and stock has not changed."));
          assert.ok(!JSON.stringify(body).includes("private-provider-key-and-document-text"));
        }
      }
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM estock_drafts")).rows[0].n,
        count,
      );
      assert.equal((await inv.getProduct(base.id)).stock, balance);
    },
  );
  await check(
    "provider error/invalid JSON and invalid/oversize image change no stock",
    async () => {
      const before = (await inv.getProduct(base.id)).stock;
      globalThis.__auditExtraction = new Error("synthetic outage");
      await rejected(() => drafts.createDraft(imageRequest()), "GEMINI_UNAVAILABLE");
      globalThis.__auditExtraction = "not json";
      await rejected(() => drafts.createDraft(imageRequest()), "GEMINI_INVALID_RESULT");
      await rejected(
        () =>
          drafts.createDraft(
            imageRequest(new File(["not an image"], "bad.png", { type: "image/png" })),
          ),
        "INVALID_IMAGE",
      );
      await rejected(
        () =>
          drafts.createDraft(
            imageRequest(
              new File([new Uint8Array(7 * 1024 * 1024)], "large.png", { type: "image/png" }),
            ),
          ),
        "IMAGE_TOO_LARGE",
      );
      assert.equal((await inv.getProduct(base.id)).stock, before);
    },
  );
  await check(
    "blank unreadable line can be excluded with a reason while valid lines complete",
    async () => {
      const draft = await newDraft([line(base.name), line("", "", "")]);
      const values = edits(draft);
      values[1].excluded = true;
      values[1].exclusionReason = "Unreadable non-stock line";
      const before = (await inv.getProduct(base.id)).stock;
      const saved = await save(draft, values);
      assert.equal((await inv.getProduct(base.id)).stock, before);
      assert.equal(saved.lines[1].rawName, "");
      assert.equal(saved.lines[1].rawQuantity, null);
      assert.equal(saved.lines[1].reviewedName, "");
      assert.equal(saved.lines[1].exclusionReason, "Unreadable non-stock line");
      await complete(saved);
      assert.equal((await inv.getProduct(base.id)).stock, before + 1);
      assert.equal((await inv.listHistory()).filter((x) => x.draftId === draft.id).length, 1);
      const invalid = await newDraft([line(base.name), line("", "", "")]);
      const invalidEdits = edits(invalid);
      invalidEdits[1].excluded = true;
      await rejected(() => save(invalid, invalidEdits), "INVALID_INPUT");
    },
  );
  await check("Manager and shared Staff sessions; Staff direct Manager API denials", async () => {
    const manager = await auth.signIn("manager", process.env.ESTOCK_MANAGER_PASSWORD);
    const staff = await auth.signIn("staff", process.env.ESTOCK_STAFF_PASSWORD);
    const request = (token, method = "GET") =>
      new NextRequest("http://0.0.0.0:3000/api/estock/test", {
        method,
        headers: {
          Host: "localhost:3000",
          Origin: "http://localhost:3000",
          Cookie: `${auth.COOKIE}=${token}`,
          ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
        },
        ...(method !== "GET" ? { body: "{}" } : {}),
      });
    assert.equal(await auth.requireRole(request(manager), "manager"), "manager");
    assert.equal(await auth.requireRole(request(staff)), "staff");
    const cases = [
      ["products/route.ts", "POST"],
      ["products/[id]/route.ts", "PATCH"],
      ["products/[id]/route.ts", "DELETE"],
      ["drafts/[id]/send/route.ts", "POST"],
      ["drafts/[id]/recall/route.ts", "POST"],
      ["drafts/route.ts", "GET"],
      ["drafts/route.ts", "POST"],
      ["drafts/[id]/route.ts", "GET"],
      ["drafts/[id]/route.ts", "PATCH"],
      ["drafts/[id]/approve/route.ts", "POST"],
      ["drafts/[id]/discard/route.ts", "POST"],
      ["history/route.ts", "GET"],
    ];
    for (const [file, method] of cases) {
      const route = await load(`src/app/api/estock/${file}`);
      const response = await route[method](request(staff, method), {
        params: Promise.resolve({ id: randomUUID() }),
      });
      assert.equal(response.status, 403, `${file} ${method}`);
      assert.equal((await response.json()).code, "FORBIDDEN");
    }
    const route = await load("src/app/api/estock/products/route.ts");
    assert.equal((await route.GET(request(staff))).status, 200);
    process.env.NODE_ENV = "production";
    await rejected(
      () => auth.signIn("staff", process.env.ESTOCK_STAFF_PASSWORD),
      "AUTH_NOT_CONFIGURED",
    );
    process.env.NODE_ENV = "development";
  });
  await check(
    "localhost Host/bind-address origin accepted; cross-site/port/forwarded spoof denied",
    async () => {
      const req = (headers) => new Request("http://0.0.0.0:3000/api/estock/session", { headers });
      input.sameOrigin(
        req({
          Host: "localhost:3000",
          Origin: "http://localhost:3000",
          "sec-fetch-site": "same-origin",
        }),
      );
      for (const headers of [
        { Host: "localhost:3000", Origin: "http://localhost:3001" },
        { Host: "localhost:3000", Origin: "https://cross.invalid" },
        { Host: "localhost:3000", Origin: "http://localhost:3000", "sec-fetch-site": "cross-site" },
        {
          Host: "localhost:3000",
          Origin: "https://forwarded.invalid",
          "x-forwarded-host": "forwarded.invalid",
        },
      ]) {
        assert.throws(
          () => input.sameOrigin(req(headers)),
          (error) => error.code === "FORBIDDEN",
        );
      }
    },
  );
  await check(
    "receipt history groups by draft ID; same-date bon stay separate; pending/discarded absent",
    async () => {
      const { receiptHistory, matchesHistorySearch } = await load("src/lib/estock-history.ts");
      const a = await product("History Product A");
      const b = await product("History Product B");
      const first = await newDraft([line(a.name, "2"), line(b.name, "3")], "2026-10-02");
      const second = await newDraft([line(a.name, "4")], "2026-10-02");
      const pending = await newDraft([line(b.name, "7")], "2026-10-02");
      const discarded = await newDraft([line(b.name, "8")], "2026-10-02");
      await drafts.discardDraft(discarded.id, { expectedRevision: discarded.revision });
      await complete(first);
      await complete(second);
      const history = await inv.listHistory();
      const receipts = receiptHistory(history);
      assert.equal(receipts.filter((r) => r.documentDate === "2026-10-02").length, 2);
      assert.equal(receipts.find((r) => r.draftId === first.id).lines.length, 2);
      assert.deepEqual(
        receipts.find((r) => r.draftId === first.id).lines.map((l) => l.productName),
        [a.name, b.name],
      );
      assert.ok(!receipts.some((r) => [pending.id, discarded.id].includes(r.draftId)));
      const matches = receipts.filter((r) =>
        r.lines.some((l) => matchesHistorySearch(l, "history product b")),
      );
      assert.equal(matches.length, 1);
      assert.equal(matches[0].lines.length, 2);
      const opening = history.find((m) => m.productId === a.id && m.type === "OPENING");
      assert.equal(opening.actorAccountId, "manager");
      await inv.editProduct(a.id, { name: "History Product Renamed", expectedVersion: a.version });
      assert.equal(
        (await inv.listHistory()).find((m) => m.draftId === first.id && m.productId === a.id)
          .productName,
        a.name,
      );
    },
  );
  await check(
    "extraction deadline aborts a stalled provider; timeout/provider failures save no draft or stock",
    async () => {
      const { withExtractionDeadline, EXTRACTION_TIMEOUT_MS } = await load(
        "src/lib/server/estock/extraction-deadline.ts",
      );
      assert.equal(EXTRACTION_TIMEOUT_MS, 45000);
      let signal;
      await rejected(
        () =>
          withExtractionDeadline((s) => {
            signal = s;
            return new Promise(() => {});
          }, 20),
        "GEMINI_TIMEOUT",
      );
      assert.equal(signal.aborted, true);
      const before = (await pool.query("SELECT count(*)::int n FROM estock_drafts")).rows[0].n;
      const balance = (await inv.getProduct(base.id)).stock;
      globalThis.__auditExtraction = new DOMException("Test-only timeout", "TimeoutError");
      await rejected(() => drafts.createDraft(imageRequest()), "GEMINI_TIMEOUT");
      assert.equal(
        (await pool.query("SELECT count(*)::int n FROM estock_drafts")).rows[0].n,
        before,
      );
      assert.equal((await inv.getProduct(base.id)).stock, balance);
      assert.equal(globalThis.__auditSdkOptions.httpOptions.retryOptions.attempts, 1);
      assert.equal(globalThis.__auditSdkOptions.httpOptions.timeout, 45000);
      assert.ok(globalThis.__auditSdkInput.config.abortSignal instanceof AbortSignal);
    },
  );
  await check(
    "HTTP login/session roles and Staff movement API ignore caller role escalation",
    async () => {
      const session = await load("src/app/api/estock/session/route.ts");
      const make = (path, method = "GET", body, token) =>
        new NextRequest(`http://0.0.0.0:3000/api/estock/${path}`, {
          method,
          headers: {
            Host: "localhost:3000",
            Origin: "http://localhost:3000",
            ...(token ? { Cookie: `${auth.COOKIE}=${token}` } : {}),
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      for (const role of ["manager", "staff"]) {
        const response = await session.POST(
          make("session", "POST", { role, password: process.env.ESTOCK_MANAGER_PASSWORD }),
        );
        assert.equal(response.status, 200);
        assert.equal((await response.json()).role, role);
        const token = response.cookies.get(auth.COOKIE).value;
        assert.equal(
          (await (await session.GET(make("session", "GET", undefined, token))).json()).role,
          role,
        );
      }
      assert.equal(
        (
          await session.POST(
            make("session", "POST", { role: "manager", password: "test-only-wrong-value" }),
          )
        ).status,
        401,
      );
      const staff = await auth.signIn("staff", process.env.ESTOCK_STAFF_PASSWORD);
      const route = await load("src/app/api/estock/movements/route.ts");
      const p = await product("API Movement Product", 5);
      const response = await route.POST(
        make(
          "movements",
          "POST",
          { productId: p.id, type: "TAKE", quantity: 2, requestId: key(), role: "manager" },
          staff,
        ),
      );
      assert.equal(response.status, 201);
      assert.equal((await response.json()).movement.actorRole, "staff");
      const rejected = await route.POST(
        make(
          "movements",
          "POST",
          { productId: p.id, type: "INTAKE", quantity: 2, requestId: key() },
          staff,
        ),
      );
      assert.equal(rejected.status, 400);
      assert.equal((await inv.getProduct(p.id)).stock, 3);
      const products = await load("src/app/api/estock/products/route.ts");
      assert.equal((await products.GET(make("products"))).status, 401);
    },
  );
  await check(
    "missing date, product and approved quantity block included-line receiving; raw values survive",
    async () => {
      let draft = await newDraft([line("Unknown unreadable", "", "")], "");
      assert.equal(draft.documentDate, null);
      assert.equal(draft.lines[0].approvedQuantity, null);
      assert.equal(draft.lines[0].needsReview, true);
      await rejected(() => complete(draft), "INVALID_INPUT");
      draft = (
        await drafts.saveDraft(draft.id, {
          expectedRevision: draft.revision,
          documentDate: date,
          lines: edits(draft),
        })
      ).draft;
      await rejected(() => complete(draft), "INVALID_INPUT");
      const p = await product("Resolved Unknown", 0);
      draft = await save(draft, [{ ...edits(draft)[0], productId: p.id, approvedQuantity: 6 }]);
      const result = await complete(draft);
      assert.equal(result.movements[0].rawQuantity, null);
      assert.equal(result.movements[0].quantity, 6);
      assert.equal((await inv.getProduct(p.id)).stock, 6);
    },
  );
  await check(
    "saved draft survives fresh database connection and child process without retained image fields",
    async () => {
      const draft = await newDraft([line(base.name, "2")]);
      const { spawnSync } = await import("node:child_process");
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=commonjs",
          "-e",
          `const pg=require('pg');(async()=>{const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();const r=await c.query('SELECT status FROM estock_drafts WHERE id=$1',[process.env.ESTOCK_SAVED_TEST_DRAFT]);console.log(r.rows[0]?.status);await c.end();})().catch(()=>{process.exitCode=1;});`,
        ],
        { cwd: root, env: { ...process.env, ESTOCK_SAVED_TEST_DRAFT: draft.id }, encoding: "utf8" },
      );
      assert.equal(result.status, 0);
      assert.equal(result.stdout.trim(), "DRAFT");
      const columns = await pool.query(
        "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1",
        [schema],
      );
      assert.ok(
        !columns.rows.some(
          (r) => r.data_type === "bytea" || /image|photo|base64/.test(r.column_name),
        ),
      );
    },
  );
  await check(
    "catalogue edits change only name; invalid setup and stale edits leave stock/units intact",
    async () => {
      const p = await product("Edit Safety Product", 7);
      const edited = await inv.editProduct(p.id, {
        name: "Edited Safety Product",
        expectedVersion: p.version,
        unit: "boxes",
        stock: 999,
      });
      assert.equal(edited.product.stock, 7);
      assert.equal(edited.product.unit, "pcs");
      assert.equal(edited.product.name, "Edited Safety Product");
      await rejected(
        () => inv.editProduct(p.id, { name: "Stale", expectedVersion: p.version }),
        "STALE_PRODUCT",
      );
      for (const fields of [
        { name: "", unit: "pcs" },
        { name: "Invalid unit", unit: "" },
      ])
        await rejected(
          () => inv.createProduct({ ...fields, openingStock: 0, requestId: key() }),
          "INVALID_INPUT",
        );
      assert.equal(
        (await inv.listHistory()).find((m) => m.productId === p.id).productName,
        "Edit Safety Product",
      );
    },
  );
  await check(
    "invalid/excessive Take and malformed provider fields cannot bypass review; excluded extra data is not retained",
    async () => {
      const p = await product("Validation Safety Product", 5);
      const before = (await inv.listHistory()).filter((m) => m.productId === p.id).length;
      for (const quantity of [0, -1, 0.5, 6])
        await rejected(
          () =>
            inv.recordMovement("staff", {
              productId: p.id,
              type: "TAKE",
              quantity,
              requestId: key(),
            }),
          quantity === 6 ? "INSUFFICIENT_STOCK" : "INVALID_INPUT",
        );
      assert.equal((await inv.getProduct(p.id)).stock, 5);
      assert.equal((await inv.listHistory()).filter((m) => m.productId === p.id).length, before);
      let draft = await newDraft([line(p.name, "NaN", "pcs")], "2026-02-30");
      assert.equal(draft.documentDate, null);
      assert.equal(draft.lines[0].rawQuantity, null);
      assert.equal(draft.lines[0].approvedQuantity, null);
      assert.equal(draft.lines[0].needsReview, true);
      await rejected(() => complete(draft), "INVALID_INPUT");
      assert.equal((await inv.getProduct(p.id)).stock, 5);
      globalThis.__auditExtraction = {
        documentDate: date,
        lines: [{ ...line(p.name), price: "EXCLUDED_MONETARY_SENTINEL" }],
        payment: "EXCLUDED_MONETARY_SENTINEL",
      };
      draft = (await drafts.createDraft(imageRequest())).draft;
      assert.ok(!JSON.stringify(draft).includes("EXCLUDED_MONETARY_SENTINEL"));
      assert.equal((await inv.getProduct(p.id)).stock, 5);
    },
  );
  await check(
    "send freezes validated quantities; no stock, matching check posts once and notifications resolve",
    async () => {
      const p = await product("Send Freeze Product", 10);
      const draft = await newDraft([line(p.name, "20")]);
      const sent = await send(draft);
      assert.equal(sent.draft.status, "AWAITING_STAFF");
      assert.equal((await inv.getProduct(p.id)).stock, 10);
      await rejected(() => save(sent.draft), "DRAFT_CLOSED");
      await rejected(() => drafts.approveDraft(draft.id, {}), "APPROVAL_RETIRED");
      const notices = await receiving.listNotifications("staff");
      const notice = notices.notifications.find((n) => n.receiptId === draft.id);
      assert.ok(notice.actionable);
      assert.equal(notice.readAt, null);
      await receiving.readNotification(notice.id, "staff");
      assert.ok(
        (await receiving.listNotifications("staff")).notifications.find((n) => n.id === notice.id)
          .readAt,
      );
      await rejected(() => receiving.readNotification(notice.id, "manager"), "NOT_FOUND");
      assert.equal((await inv.getProduct(p.id)).stock, 10);
      const receipt = await receiving.getReceipt(draft.id, "staff");
      const operation = key();
      const first = await confirm(receipt, undefined, operation);
      const replay = await confirm(receipt, undefined, operation);
      assert.equal(first.receipt.receivedAt, replay.receipt.receivedAt);
      assert.equal((await inv.getProduct(p.id)).stock, 30);
      await rejected(() => confirm(receipt), "RECEIPT_CLOSED");
      assert.ok(!(await receiving.listReceiving("staff")).some((r) => r.id === draft.id));
      assert.equal(
        (await receiving.listNotifications("staff")).notifications.find((n) => n.id === notice.id)
          .actionable,
        false,
      );
      assert.ok(
        !(await receiving.listNotifications("manager")).notifications.some(
          (n) => n.receiptId === draft.id,
        ),
      );
    },
  );
  await check(
    "Lamp shortage and extra adjust incoming quantities only; notification stores expected/actual check",
    async () => {
      const a = await product("Lamp 5W", 10),
        b = await product("Lamp 10W", 0);
      const draft = await newDraft([line(a.name, "20"), line(b.name, "20")]);
      await send(draft);
      const receipt = await receiving.getReceipt(draft.id, "staff");
      await confirm(receipt, [
        { id: receipt.lines[0].id, outcome: "SHORT", difference: 2 },
        { id: receipt.lines[1].id, outcome: "EXTRA", difference: 3 },
      ]);
      assert.equal((await inv.getProduct(a.id)).stock, 28);
      assert.equal((await inv.getProduct(b.id)).stock, 23);
      const saved = await receiving.getReceipt(draft.id, "manager");
      assert.deepEqual(
        saved.lines.map((l) => [l.expected, l.actual, l.difference]),
        [
          [20, 18, 2],
          [20, 23, 3],
        ],
      );
      const notices = (await receiving.listNotifications("manager")).notifications.filter(
        (n) => n.receiptId === draft.id,
      );
      assert.equal(notices.length, 1);
      assert.equal(notices[0].kind, "DISCREPANCY");
      assert.equal(
        (await receiving.listNotifications("staff")).notifications.some(
          (n) => n.id === notices[0].id,
        ),
        false,
      );
    },
  );
  await check(
    "missing whole line and entirely missing delivery persist without zero Intake",
    async () => {
      const p = await product("Missing Delivery Product", 7);
      for (const allMissing of [false, true]) {
        const draft = await newDraft([line(p.name, "4"), line(p.name, "6")]);
        await send(draft);
        const r = await receiving.getReceipt(draft.id, "staff");
        await confirm(
          r,
          r.lines.map((l, i) => ({
            id: l.id,
            outcome: allMissing || i === 0 ? "SHORT" : "MATCH",
            ...(allMissing || i === 0 ? { difference: l.expected } : {}),
          })),
        );
        const saved = await receiving.getReceipt(draft.id, "manager");
        assert.equal(saved.lines[0].actual, 0);
        assert.equal(
          (await inv.listHistory()).filter((m) => m.draftId === draft.id).length,
          allMissing ? 0 : 1,
        );
        assert.ok((await receiving.listReceiving("manager")).some((r) => r.id === draft.id));
        assert.ok(
          (await receiving.listNotifications("manager")).notifications.some(
            (n) => n.receiptId === draft.id,
          ),
        );
      }
      assert.equal((await inv.getProduct(p.id)).stock, 13);
    },
  );
  await check(
    "invalid, duplicate, foreign, excluded and unsafe check payloads reject atomically",
    async () => {
      const p = await product("Invalid Check Product", 9);
      let draft = await newDraft([line(p.name, "3"), line("excluded text")]);
      const values = edits(draft);
      values[1].excluded = true;
      values[1].exclusionReason = "Non-stock";
      draft = await save(draft, values);
      await send(draft);
      const r = await receiving.getReceipt(draft.id, "staff"),
        l = r.lines[0];
      for (const payload of [
        [],
        [{ id: l.id, outcome: "SHORT", difference: 0 }],
        [{ id: l.id, outcome: "SHORT", difference: 4 }],
        [{ id: l.id, outcome: "EXTRA", difference: 0.5 }],
        [{ id: l.id, outcome: "EXTRA", difference: Number.MAX_SAFE_INTEGER }],
        [{ id: l.id, outcome: "EXTRA", difference: "2" }],
        [{ id: l.id, outcome: "SHORT", difference: -2 }],
        [{ id: l.id, outcome: "MATCH", difference: 2 }],
        [{ id: randomUUID(), outcome: "MATCH" }],
        [{ id: draft.lines[1].id, outcome: "MATCH" }],
        [
          { id: l.id, outcome: "MATCH" },
          { id: l.id, outcome: "MATCH" },
        ],
        [{ id: l.id, outcome: "INVENTED" }],
      ])
        await rejected(() => confirm(r, payload), "INVALID_INPUT");
      await rejected(() => confirm({ ...r, revision: r.revision + 1 }), "STALE_DRAFT");
      assert.equal((await inv.getProduct(p.id)).stock, 9);
      assert.equal((await receiving.getReceipt(r.id, "staff")).lines[0].actual, null);
    },
  );
  await check(
    "simultaneous Staff confirmations different and same request IDs post once",
    async () => {
      const p = await product("Double Confirm Product", 0);
      for (const same of [false, true]) {
        const draft = await newDraft([line(p.name, "2")]);
        await send(draft);
        const r = await receiving.getReceipt(draft.id, "staff");
        const operation = key();
        const result = await Promise.allSettled([
          confirm(r, undefined, operation),
          confirm(r, undefined, same ? operation : key()),
        ]);
        assert.equal(result.filter((r) => r.status === "fulfilled").length, same ? 2 : 1);
        assert.equal((await inv.listHistory()).filter((m) => m.draftId === draft.id).length, 1);
      }
      assert.equal((await inv.getProduct(p.id)).stock, 4);
    },
  );
  await check(
    "notification failure rolls back check, balances and movements; retry succeeds",
    async () => {
      const p = await product("Atomic Notification Product", 5);
      const draft = await newDraft([line(p.name, "3")]);
      await send(draft);
      const r = await receiving.getReceipt(draft.id, "staff");
      await pool.query(
        "CREATE FUNCTION audit_fail_notice() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='DISCREPANCY' THEN RAISE EXCEPTION 'synthetic notification failure'; END IF; RETURN NEW; END $$",
      );
      await pool.query(
        "CREATE TRIGGER audit_fail_notice BEFORE INSERT ON estock_notifications FOR EACH ROW EXECUTE FUNCTION audit_fail_notice()",
      );
      const outcomes = [{ id: r.lines[0].id, outcome: "SHORT", difference: 1 }],
        operation = key();
      await assert.rejects(() => confirm(r, outcomes, operation));
      assert.equal((await inv.getProduct(p.id)).stock, 5);
      assert.equal((await receiving.getReceipt(r.id, "staff")).lines[0].actual, null);
      assert.equal(
        (await pool.query("SELECT 1 FROM estock_receipt_checks WHERE draft_id=$1", [r.id]))
          .rowCount,
        0,
      );
      assert.equal(
        (await pool.query("SELECT 1 FROM estock_movements WHERE draft_id=$1", [r.id])).rowCount,
        0,
      );
      assert.ok(
        (await receiving.listNotifications("staff")).notifications.find((n) => n.receiptId === r.id)
          .actionable,
      );
      await pool.query("DROP TRIGGER audit_fail_notice ON estock_notifications");
      await pool.query("DROP FUNCTION audit_fail_notice()");
      await confirm(r, outcomes, operation);
      assert.equal((await inv.getProduct(p.id)).stock, 7);
    },
  );
  await check(
    "archive retains stock/history; excludes matching and movements; recall/resubmit repairs pending receipt",
    async () => {
      const p = await product("Archive Product", 12);
      const draft = await newDraft([line(p.name, "3")]);
      await send(draft);
      const r = await receiving.getReceipt(draft.id, "staff");
      const payload = { expectedVersion: p.version, requestId: key() };
      await inv.archiveProduct(p.id, payload);
      await inv.archiveProduct(p.id, payload);
      const archived = (await pool.query("SELECT * FROM estock_products WHERE id=$1", [p.id]))
        .rows[0];
      assert.equal(Number(archived.archived_stock), 12);
      assert.equal(Number(archived.stock), 12);
      assert.ok(!(await inv.listProducts()).some((x) => x.id === p.id));
      assert.equal((await inv.matchProducts(p.name)).length, 0);
      for (const type of ["TAKE", "RETURN"])
        await rejected(
          () =>
            inv.recordMovement("staff", { productId: p.id, type, quantity: 1, requestId: key() }),
          "ARCHIVED_PRODUCT",
        );
      await rejected(() => confirm(r), "ARCHIVED_PRODUCT");
      const correction = (await receiving.recallReceipt(r.id, { expectedRevision: r.revision }))
        .draft;
      await rejected(() => confirm(r), "RECEIPT_CLOSED");
      const replacement = await product("Replacement Product");
      const updated = await save(correction, [
        { ...edits(correction)[0], productId: replacement.id },
      ]);
      await send(updated);
      await rejected(() => confirm(r), "STALE_DRAFT");
      const latest = await receiving.getReceipt(r.id, "staff");
      await confirm(latest);
      assert.equal((await inv.getProduct(replacement.id)).stock, 3);
      assert.ok(
        (await inv.listHistory()).some((m) => m.productId === p.id && m.type === "OPENING"),
      );
    },
  );
  await check(
    "Take bounds both roles at available stock and zero; archive races serialize",
    async () => {
      for (const role of ["manager", "staff"]) {
        const p = await product(`Take Boundary ${role}`, 3);
        await rejected(
          () =>
            inv.recordMovement(role, {
              productId: p.id,
              type: "TAKE",
              quantity: 4,
              requestId: key(),
            }),
          "INSUFFICIENT_STOCK",
        );
        await inv.recordMovement(role, {
          productId: p.id,
          type: "TAKE",
          quantity: 3,
          requestId: key(),
        });
        await rejected(
          () =>
            inv.recordMovement(role, {
              productId: p.id,
              type: "TAKE",
              quantity: 1,
              requestId: key(),
            }),
          "INSUFFICIENT_STOCK",
        );
      }
      const p = await product("Archive Take Race", 6);
      const result = await Promise.allSettled([
        inv.archiveProduct(p.id, { expectedVersion: p.version, requestId: key() }),
        inv.recordMovement("staff", {
          productId: p.id,
          type: "TAKE",
          quantity: 2,
          requestId: key(),
        }),
      ]);
      assert.equal(result[0].status, "fulfilled");
      const saved = (await pool.query("SELECT * FROM estock_products WHERE id=$1", [p.id])).rows[0];
      assert.ok(saved.archived_at);
      assert.equal(Number(saved.stock), result[1].status === "fulfilled" ? 4 : 6);
      assert.equal(saved.stock, saved.archived_stock);
      const q = await product("Archive Confirm Race", 5),
        draft = await newDraft([line(q.name, "2")]);
      await send(draft);
      const r = await receiving.getReceipt(draft.id, "staff");
      const race = await Promise.allSettled([
        inv.archiveProduct(q.id, { expectedVersion: q.version, requestId: key() }),
        confirm(r),
      ]);
      const row = (await pool.query("SELECT * FROM estock_products WHERE id=$1", [q.id])).rows[0];
      assert.equal(Number(row.stock), race[1].status === "fulfilled" ? 7 : 5);
      assert.equal(row.stock, row.archived_stock);
    },
  );
  await check("receiving API enforces session roles and retired Manager path", async () => {
    const manager = await auth.signIn("manager", process.env.ESTOCK_MANAGER_PASSWORD),
      staff = await auth.signIn("staff", process.env.ESTOCK_STAFF_PASSWORD);
    const req = (token) =>
      new NextRequest("http://localhost:3000/api/estock/test", {
        method: "POST",
        headers: { Cookie: `${auth.COOKIE}=${token}`, "Content-Type": "application/json" },
        body: "{}",
      });
    const confirmRoute = await load("src/app/api/estock/receiving/[id]/confirm/route.ts");
    assert.equal(
      (await confirmRoute.POST(req(manager), { params: Promise.resolve({ id: randomUUID() }) }))
        .status,
      403,
    );
    const old = await load("src/app/api/estock/drafts/[id]/approve/route.ts");
    assert.equal(
      (await old.POST(req(manager), { params: Promise.resolve({ id: randomUUID() }) })).status,
      410,
    );
    const notifications = await load("src/app/api/estock/notifications/route.ts");
    for (const [token, role] of [
      [manager, "manager"],
      [staff, "staff"],
    ]) {
      const response = await notifications.GET(
        new NextRequest("http://localhost:3000/api/estock/notifications", {
          headers: { Cookie: `${auth.COOKIE}=${token}` },
        }),
      );
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(
        data.notifications.some((n) =>
          role === "staff" ? n.kind !== "RECEIVING" : n.kind !== "DISCREPANCY",
        ),
        false,
      );
    }
  });
  await check(
    "fresh and old populated schemas migrate repeatably without changing credentials, stock or history",
    async () => {
      const { migrate } = await import("../../db/estock/migrate.mjs");
      const { readFileSync } = await import("node:fs");
      for (const legacy of [false, true]) {
        const owned = `estock_upgrade_${randomBytes(8).toString("hex")}`;
        await control.query(`CREATE SCHEMA "${owned}"`);
        const url = new URL(process.env.DATABASE_URL);
        url.searchParams.set("options", `-c search_path=${owned}`);
        const c = new pg.Client({ connectionString: url.href });
        try {
          await c.connect();
          if (legacy) {
            await c.query(readFileSync(resolve(root, "db/estock/001_initial.sql"), "utf8"));
            const productId = randomUUID(),
              draftId = randomUUID(),
              lineId = randomUUID();
            await c.query(
              "INSERT INTO estock_sessions(token_hash,account_id,role,expires_at) VALUES('synthetic-preserved','staff','staff',now()+interval '1 day')",
            );
            await c.query(
              "INSERT INTO estock_products(id,official_name,normalized_name,unit,stock) VALUES($1,'Upgrade Lamp','upgrade lamp','pcs',12)",
              [productId],
            );
            await c.query(
              "INSERT INTO estock_drafts(id,status,model_id,approved_at,approved_by,approved_account_id,actual_receipt_confirmed) VALUES($1,'APPROVED','synthetic',now(),'manager','manager',true)",
              [draftId],
            );
            await c.query(
              "INSERT INTO estock_draft_lines(id,draft_id,line_order,raw_name,reviewed_name,product_id,approved_quantity) VALUES($1,$2,0,'Raw','Reviewed',$3,12)",
              [lineId, draftId, productId],
            );
            await c.query(
              "INSERT INTO estock_movements(id,source_event_id,product_id,product_name,unit,type,quantity,delta,balance_after,actor_role,actor_account_id,draft_id,line_id) VALUES($1,'legacy-intake',$2,'Upgrade Lamp','pcs','INTAKE',12,12,12,'manager','manager',$3,$4)",
              [randomUUID(), productId, draftId, lineId],
            );
            await c.query("INSERT INTO estock_drafts(id,model_id) VALUES($1,'synthetic')", [
              randomUUID(),
            ]);
          }
          const before = legacy
            ? (await c.query("SELECT row_to_json(p) AS data FROM estock_products p")).rows[0].data
            : null;
          await migrate(c);
          await migrate(c);
          assert.equal(
            (await c.query("SELECT count(*)::int n FROM estock_schema_migrations")).rows[0].n,
            2,
          );
          assert.equal(
            (await c.query("SELECT count(*)::int n FROM estock_notifications")).rows[0].n,
            0,
          );
          assert.equal(
            (await c.query("SELECT count(*)::int n FROM estock_receipt_submissions")).rows[0].n,
            0,
          );
          if (legacy) {
            const after = (await c.query("SELECT row_to_json(p) AS data FROM estock_products p"))
              .rows[0].data;
            for (const [key, value] of Object.entries(before)) assert.deepEqual(after[key], value);
            assert.equal(
              (await c.query("SELECT count(*)::int n FROM estock_movements")).rows[0].n,
              1,
            );
            assert.equal(
              (await c.query("SELECT approved_by FROM estock_drafts WHERE status='APPROVED'"))
                .rows[0].approved_by,
              "manager",
            );
            assert.equal(
              (await c.query("SELECT count(*)::int n FROM estock_drafts WHERE status='DRAFT'"))
                .rows[0].n,
              1,
            );
            assert.equal(
              (await c.query("SELECT token_hash FROM estock_sessions")).rows[0].token_hash,
              "synthetic-preserved",
            );
          }
        } finally {
          await c.end();
          await control.query(`DROP SCHEMA "${owned}" CASCADE`);
        }
      }
    },
  );
  await check(
    "send notification failure rolls back submission and request; preparation Opening enforced",
    async () => {
      const p = await product("Send Rollback Product", 4),
        draft = await newDraft([line(p.name, "2")]);
      await rejected(
        () =>
          inv.createProduct({
            name: "Unsafe Preparation",
            unit: "pcs",
            openingStock: 2,
            preparationDraftId: draft.id,
            requestId: key(),
          }),
        "INVALID_INPUT",
      );
      const created = await inv.createProduct({
        name: "Zero Preparation",
        unit: "pcs",
        openingStock: 0,
        preparationDraftId: draft.id,
        requestId: key(),
      });
      assert.equal(created.product.stock, 0);
      await pool.query(
        "CREATE FUNCTION audit_fail_send() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='RECEIVING' THEN RAISE EXCEPTION 'synthetic send failure'; END IF; RETURN NEW; END $$",
      );
      await pool.query(
        "CREATE TRIGGER audit_fail_send BEFORE INSERT ON estock_notifications FOR EACH ROW EXECUTE FUNCTION audit_fail_send()",
      );
      const operation = key();
      await assert.rejects(() => send(draft, operation));
      assert.equal((await drafts.getDraft(draft.id)).status, "DRAFT");
      assert.equal((await inv.getProduct(p.id)).stock, 4);
      for (const table of [
        "estock_receipt_submissions",
        "estock_receipt_lines",
        "estock_notifications",
      ])
        assert.equal(
          (await pool.query(`SELECT 1 FROM ${table} WHERE draft_id=$1`, [draft.id])).rowCount,
          0,
        );
      assert.equal(
        (await pool.query("SELECT 1 FROM estock_requests WHERE request_id=$1", [operation]))
          .rowCount,
        0,
      );
      await pool.query("DROP TRIGGER audit_fail_send ON estock_notifications");
      await pool.query("DROP FUNCTION audit_fail_send()");
      await send(draft, operation);
    },
  );
  const discrepancies = await pool.query(
    "SELECT p.id FROM estock_products p LEFT JOIN estock_movements m ON m.product_id=p.id GROUP BY p.id,p.stock HAVING p.stock<>coalesce(sum(m.delta),0)",
  );
  assert.equal(discrepancies.rowCount, 0);
  console.log("RECONCILIATION PASS: every synthetic product stock equals sum of ledger deltas");
  console.log(
    JSON.stringify({
      passed,
      failed,
      provider: "in-process stub; zero live Gemini calls",
      stubbedProviderCalls: providerCalls,
      isolation: "unique temporary PostgreSQL schema; original application tables never targeted",
    }),
  );
} finally {
  if (pool) await pool.end();
  if (created) {
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    const remaining = await control.query("SELECT 1 FROM pg_namespace WHERE nspname=$1", [schema]);
    assert.equal(remaining.rowCount, 0);
    console.log("CLEANUP PASS: temporary audit schema removed");
  }
  await control.end();
}
if (failed) process.exitCode = 1;
