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
  const approve = (draft, requestId = key()) =>
    drafts.approveDraft(draft.id, {
      expectedRevision: draft.revision,
      confirmReceived: true,
      requestId,
    });
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
          drafts.approveDraft(draft.id, {
            expectedRevision: draft.revision,
            confirmReceived: false,
            requestId: key(),
          }),
        "INVALID_INPUT",
      );
      await approve(draft);
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
  await check("atomic multi-line approval; immutable terminal draft; request replay", async () => {
    const before = (await inv.getProduct(base.id)).stock;
    const draft = await newDraft([line(base.name, "2"), line(base.name, "3")], "2026-10-01");
    assert.equal((await inv.getProduct(base.id)).stock, before);
    const requestId = key();
    const result = await approve(draft, requestId);
    assert.equal((await inv.getProduct(base.id)).stock, before + 5);
    assert.equal(result.movements.length, 2);
    assert.equal(result.movements[0].documentDate, "2026-10-01");
    assert.ok(
      result.movements.every(
        (x) =>
          Number.isFinite(Date.parse(x.createdAt)) && x.approvedAt && x.actorRole === "manager",
      ),
    );
    const replay = await approve(draft, requestId);
    assert.equal(replay.draft.id, draft.id);
    assert.equal((await inv.getProduct(base.id)).stock, before + 5);
    await rejected(
      () =>
        drafts.approveDraft(draft.id, {
          expectedRevision: draft.revision + 1,
          confirmReceived: true,
          requestId,
        }),
      "REQUEST_CONFLICT",
    );
    await rejected(() => approve(draft), "DRAFT_CLOSED");
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
    await assert.rejects(() => approve(draft, requestId));
    assert.equal((await inv.getProduct(p.id)).stock, 0);
    assert.equal((await drafts.getDraft(draft.id)).status, "DRAFT");
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
    await approve(draft, requestId);
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
    await assert.rejects(() => approve(balanceDraft, balanceKey));
    for (const selected of [left, right])
      assert.equal((await inv.getProduct(selected.id)).stock, 0);
    assert.equal((await drafts.getDraft(balanceDraft.id)).status, "DRAFT");
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
    await approve(balanceDraft, balanceKey);
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
  await check("concurrent approval; stale revision and catalogue edit detection", async () => {
    const p = await product("Concurrent Approval Product");
    let draft = await newDraft([line(p.name, "2")]);
    const results = await Promise.allSettled([approve(draft), approve(draft)]);
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await inv.getProduct(p.id)).stock, 2);
    draft = await newDraft([line(p.name, "1")]);
    const old = draft;
    draft = await save(draft);
    await rejected(() => approve(old), "STALE_DRAFT");
    await inv.editProduct(p.id, { name: "Renamed Synthetic Product", expectedVersion: p.version });
    await rejected(() => approve(draft), "STALE_PRODUCT");
    draft = await save(draft);
    await approve(draft);
    assert.equal((await inv.getProduct(p.id)).stock, 3);
    draft = await newDraft([line("Renamed Synthetic Product", "1")]);
    const race = await Promise.allSettled([save(draft), approve(draft)]);
    assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
    const afterRace = await drafts.getDraft(draft.id);
    assert.equal((await inv.getProduct(p.id)).stock, afterRace.status === "APPROVED" ? 4 : 3);
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
      await rejected(() => approve(draft), "DRAFT_CLOSED");
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
    "blank unreadable line can be excluded with a reason while valid lines approve",
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
      await approve(saved);
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
      await approve(first);
      await approve(second);
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
    "missing date, product and approved quantity block included-line approval; raw values survive",
    async () => {
      let draft = await newDraft([line("Unknown unreadable", "", "")], "");
      assert.equal(draft.documentDate, null);
      assert.equal(draft.lines[0].approvedQuantity, null);
      assert.equal(draft.lines[0].needsReview, true);
      await rejected(() => approve(draft), "INVALID_INPUT");
      draft = (
        await drafts.saveDraft(draft.id, {
          expectedRevision: draft.revision,
          documentDate: date,
          lines: edits(draft),
        })
      ).draft;
      await rejected(() => approve(draft), "INVALID_INPUT");
      const p = await product("Resolved Unknown", 0);
      draft = await save(draft, [{ ...edits(draft)[0], productId: p.id, approvedQuantity: 6 }]);
      const result = await approve(draft);
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
      await rejected(() => approve(draft), "INVALID_INPUT");
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
