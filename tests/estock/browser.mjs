import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const origin = "http://127.0.0.1:3107";
const secrets = [
  process.env.ESTOCK_MANAGER_PASSWORD,
  process.env.ESTOCK_STAFF_PASSWORD,
  process.env.ESTOCK_SESSION_SECRET,
  process.env.GEMINI_API_KEY,
].filter(Boolean);
const redact = (text) =>
  secrets.reduce((safe, secret) => safe.split(secret).join("[redacted]"), String(text));
const artifacts = join(process.cwd(), ".artifacts", "estock-mvp");
mkdirSync(artifacts, { recursive: true });
let serverLog = "";
let identity;
let browser;
let manager;
let staffPage;
let step = "start isolated preview";
const results = [];
const runtimeErrors = [];
const consoleDiagnostics = [];
function observeConsole(page) {
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      consoleDiagnostics.push({ level: message.type(), text: redact(message.text()) });
  });
}
const preview = spawn(process.execPath, ["tests/estock/preview.mjs"], {
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});
preview.stdout.on("data", (data) => {
  serverLog += data;
  identity = serverLog.match(/Preview identity: (estock_preview_[a-f0-9]{16})/)?.[1];
});
preview.stderr.on("data", (data) => {
  serverLog += data;
});
const hasExited = () => preview.exitCode !== null;
const previewStopped = new Promise((done) => preview.once("close", done));

async function check(name, operation) {
  step = name;
  await operation();
  results.push({ scenario: name, result: "Pass" });
  console.log(`BROWSER PASS: ${name}`);
}
async function visible(locator) {
  await locator.waitFor({ state: "visible", timeout: 20000 });
}
async function login(page, role) {
  await page.goto(`${origin}/demo`);
  await visible(page.getByRole("heading", { name: "Sign in to eStock" }));
  await page.getByRole("radio", { name: new RegExp(`^${role}`, "i") }).check();
  await page
    .getByLabel("Access code")
    .fill(
      role === "manager" ? process.env.ESTOCK_MANAGER_PASSWORD : process.env.ESTOCK_STAFF_PASSWORD,
    );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await visible(page.getByRole("navigation", { name: "Workspace sections" }));
}
async function createProduct(page, name, opening) {
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Official product name").fill(name);
  if (await dialog.getByLabel("Opening stock").count())
    await dialog.getByLabel("Opening stock").fill(String(opening));
  await dialog.getByRole("button", { name: "Add product", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}
async function api(page, path, method = "GET", body) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const r = await fetch(`/api/estock/${path}`, {
        method,
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      return { status: r.status, body: await r.json() };
    },
    { path, method, body },
  );
}
async function noOverflow(page) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    "Essential horizontal overflow",
  );
}

try {
  for (let i = 0; i < 180; i++) {
    if (hasExited()) throw new Error("Owned preview stopped before browser startup");
    if (identity) {
      try {
        const response = await fetch(`${origin}/estock-test-preview-id.txt`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok && (await response.text()) === identity) break;
      } catch {}
    }
    if (i === 179) throw new Error("Owned preview did not become ready");
    await delay(250);
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  manager = await context.newPage();
  observeConsole(manager);
  manager.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
  let draftPosts = 0;
  manager.on("request", (request) => {
    if (request.url() === `${origin}/api/estock/drafts` && request.method() === "POST")
      draftPosts++;
  });
  await check("Manager development sign-in and empty Inventory/History", async () => {
    await login(manager, "manager");
    await visible(manager.getByRole("heading", { name: "Warehouse overview" }));
    await manager.getByRole("button", { name: "History", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "No approved receipts yet" }));
    await manager.getByRole("button", { name: "Stock activity", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "No stock activity yet" }));
    await manager.getByRole("button", { name: "Inventory", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "No products yet" }));
  });
  await check(
    "Create Opening 0/positive products; search, rename and low-stock boundaries",
    async () => {
      await createProduct(manager, "Synthetic Widget", 5);
      await createProduct(manager, "Synthetic Zero", 0);
      await createProduct(manager, "Synthetic Four", 4);
      const rows = manager.getByRole("list", { name: "Current warehouse stock" });
      assert.match(await rows.innerText(), /Out of stock/);
      assert.match(await rows.innerText(), /Low stock/);
      const widget = rows.getByRole("listitem").filter({ hasText: "Synthetic Widget" });
      assert.match(await widget.innerText(), /In stock/);
      await manager.getByLabel("Search products").fill("sYnThEtIc wIdGeT");
      await visible(widget);
      await widget.getByRole("button", { name: "Edit", exact: true }).click();
      const dialog = manager.getByRole("dialog");
      await dialog.getByLabel("Official product name").fill("Synthetic Widget Renamed");
      await dialog.getByRole("button", { name: "Save name", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await manager.getByLabel("Search products").fill("");
      await noOverflow(manager);
    },
  );
  const image = await manager.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const c = canvas.getContext("2d");
    c.fillStyle = "white";
    c.fillRect(0, 0, 640, 480);
    c.fillStyle = "black";
    c.font = "24px sans-serif";
    [
      "TEST ONLY - SYNTHETIC BON",
      "2026-10-02",
      "Synthetic Widget 2 pcs",
      "Unfamiliar Lamp 2 boxes",
      "Unreadable line for exclusion",
    ].forEach((line, i) => {
      c.fillText(line, 24, 50 + i * 60);
    });
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const payload = {
    name: "synthetic-bon.png",
    mimeType: "image/png",
    buffer: Buffer.from(image, "base64"),
  };
  let firstDraft;
  await check("Synthetic stub scan creates a saved draft without changing stock", async () => {
    const before = (await api(manager, "products")).body.products.map((p) => [p.id, p.stock]);
    await manager.getByRole("button", { name: "Scan receipt", exact: true }).click();
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    await visible(manager.getByAltText("Selected receipt for review before creating a draft"));
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    const pending = manager.getByRole("button", { name: /Reading document/ });
    await visible(pending);
    assert.equal(await pending.isDisabled(), true);
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    const drafts = (await api(manager, "drafts")).body.drafts;
    firstDraft = drafts[0].id;
    assert.deepEqual(
      (await api(manager, "products")).body.products.map((p) => [p.id, p.stock]),
      before,
    );
  });
  await check(
    "Saved draft reload, temporary comparison/change/remove, and mobile width",
    async () => {
      await manager.getByRole("button", { name: "Inventory", exact: true }).click();
      await manager.getByRole("button", { name: /^Drafts/ }).click();
      await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
      await manager.getByText("Compare with a bon image", { exact: true }).click();
      const posts = draftPosts;
      const before = await api(manager, `drafts/${firstDraft}`);
      await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
      await visible(
        manager.getByAltText("Temporary bon image for comparison with the saved draft"),
      );
      await manager
        .getByLabel("Upload a receipt image")
        .setInputFiles({ ...payload, name: "comparison-change.png" });
      await manager.getByRole("button", { name: "Remove image", exact: true }).click();
      assert.equal(
        await manager
          .getByAltText("Temporary bon image for comparison with the saved draft")
          .count(),
        0,
      );
      assert.equal(draftPosts, posts);
      assert.deepEqual(await api(manager, `drafts/${firstDraft}`), before);
      await manager.setViewportSize({ width: 390, height: 844 });
      await noOverflow(manager);
      await manager.screenshot({ path: join(artifacts, "draft-mobile-width.png"), fullPage: true });
      await manager.setViewportSize({ width: 1280, height: 900 });
      await manager.reload();
      await visible(manager.getByRole("heading", { name: "Warehouse overview", exact: true }));
      await manager.getByRole("button", { name: /^Drafts/ }).click();
      await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
      assert.deepEqual(await api(manager, `drafts/${firstDraft}`), before);
      assert.equal(
        await manager
          .getByAltText("Temporary bon image for comparison with the saved draft")
          .count(),
        0,
      );
    },
  );
  await check(
    "Review corrections, manual units, unknown product Opening 0 and blank-line exclusion",
    async () => {
      const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
      const first = lines.nth(0);
      await manager.getByLabel("Document date for this intake").fill("2026-10-03");
      const second = lines.nth(1);
      const blank = lines.nth(2);
      await first
        .getByLabel("Official product")
        .selectOption({ label: "Synthetic Widget Renamed · pcs (suggested)" })
        .catch(async () => {
          const p = (await api(manager, "products")).body.products.find(
            (p) => p.name === "Synthetic Widget Renamed",
          );
          await first.getByLabel("Official product").selectOption(p.id);
        });
      await first
        .getByRole("textbox", { name: "Supplier description", exact: true })
        .fill("Reviewed widget");
      await first.getByLabel(/Quantity actually received/).fill("2");
      await second.getByRole("button", { name: "Create new product", exact: true }).click();
      const dialog = manager.getByRole("dialog");
      await dialog.getByLabel("Official product name").fill("Synthetic Lamp");
      assert.equal(await dialog.getByLabel("Opening stock").count(), 0);
      await dialog.getByRole("button", { name: "Add product", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await second.getByLabel(/Quantity actually received/).fill("24");
      await blank.getByLabel("Exclude this line from Intake").check();
      await blank.getByLabel("Reason for excluding this line").fill("Unreadable non-stock line");
      assert.equal(
        await blank
          .getByRole("textbox", { name: "Supplier description", exact: true })
          .inputValue(),
        "",
      );
      await manager.getByRole("button", { name: "Save draft", exact: true }).click();
      await visible(manager.getByText("Draft saved. Stock has not changed.", { exact: true }));
      const saved = (await api(manager, `drafts/${firstDraft}`)).body.draft;
      assert.equal(saved.extractedDocumentDate, "2026-10-02");
      assert.equal(saved.documentDate, "2026-10-03");
      assert.equal(saved.lines[1].rawQuantity, 2);
      assert.equal(saved.lines[1].rawUnit, "boxes");
      assert.equal(saved.lines[1].approvedQuantity, 24);
      assert.equal(saved.lines[2].reviewedName, "");
      assert.equal(
        (await api(manager, "products")).body.products.find((p) => p.name === "Synthetic Lamp")
          .stock,
        0,
      );
      assert.equal(
        await manager.getByRole("button", { name: "Approve stock intake" }).isDisabled(),
        true,
      );
      await manager
        .getByLabel("I confirm the included quantities were received and are usable.")
        .check();
      await manager.getByRole("button", { name: "Approve stock intake", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Approved intake", exact: true }));
    },
  );
  await check(
    "Second same-date bon stays separate; Receipt history shows all included lines and search",
    async () => {
      await manager.getByRole("button", { name: "Scan receipt", exact: true }).click();
      await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
      await manager.getByRole("button", { name: "Create draft", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
      const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
      const product = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await manager.getByLabel("Document date for this intake").fill("2026-10-03");
      await lines.nth(0).getByLabel("Official product").selectOption(product.id);
      await lines
        .nth(0)
        .getByLabel(/Quantity actually received/)
        .fill("1");
      for (const i of [1, 2]) {
        await lines.nth(i).getByLabel("Exclude this line from Intake").check();
        await lines
          .nth(i)
          .getByLabel("Reason for excluding this line")
          .fill("Not received on this delivery");
      }
      await manager
        .getByLabel("I confirm the included quantities were received and are usable.")
        .check();
      await manager.getByRole("button", { name: "Approve stock intake", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Approved intake", exact: true }));
      await manager.getByRole("button", { name: "History", exact: true }).click();
      await visible(manager.getByText("2 of 2 approved receipts", { exact: true }));
      assert.equal(await manager.getByRole("article").count(), 2);
      await manager.getByLabel("Search receipts").fill("Synthetic Lamp");
      await visible(manager.getByText("1 of 2 approved receipts", { exact: true }));
      assert.match(await manager.getByRole("article").innerText(), /Synthetic Widget Renamed/);
      await manager.getByText("View receipt details", { exact: true }).click();
      assert.match(await manager.getByRole("article").innerText(), /2 boxes/);
      assert.match(await manager.getByRole("article").innerText(), /24 pcs/);
      assert.match(await manager.getByRole("article").innerText(), /MYT/);
      await manager.getByLabel("Document date", { exact: true }).fill("2026-10-04");
      await visible(manager.getByRole("heading", { name: "No matching receipts", exact: true }));
      await manager.getByLabel("Document date", { exact: true }).fill("");
      await manager.getByLabel("Search receipts").fill("");
      await manager.setViewportSize({ width: 320, height: 844 });
      await noOverflow(manager);
      await manager.screenshot({
        path: join(artifacts, "receipt-history-mobile-width.png"),
        fullPage: true,
      });
      await manager.setViewportSize({ width: 1280, height: 900 });
    },
  );
  await check("Provider failure has an actionable error and no automatic draft retry", async () => {
    const before = await api(manager, "drafts");
    const stockBefore = await api(manager, "products");
    await manager.getByRole("button", { name: "Scan receipt", exact: true }).click();
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    const posts = draftPosts;
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    const failure = manager.getByRole("alert").filter({ hasText: "stock has not changed" });
    await visible(failure);
    assert.match(await failure.innerText(), /stock has not changed/);
    assert.equal(draftPosts, posts + 1);
    assert.deepEqual(await api(manager, "drafts"), before);
    assert.equal(
      await manager.getByRole("button", { name: "Create draft", exact: true }).isEnabled(),
      true,
    );
    assert.deepEqual(await api(manager, "products"), stockBefore);
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    assert.equal(draftPosts, posts + 2);
    const pending = (await api(manager, "drafts")).body.drafts.find((d) => d.status === "DRAFT");
    assert.ok(pending);
    assert.deepEqual(await api(manager, "products"), stockBefore);
    await manager.getByRole("button", { name: "Discard draft", exact: true }).click();
    await manager.getByRole("button", { name: "Yes, discard draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Discarded draft", exact: true }));
    assert.equal((await api(manager, `drafts/${pending.id}`)).body.draft.status, "DISCARDED");
    assert.deepEqual(await api(manager, "products"), stockBefore);
  });
  await check(
    "Staff sign-in, simple navigation, Take/Return, direct denials and stale UI safety",
    async () => {
      const staffContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await staffContext.route("**/*", (route) =>
        new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
      );
      const staff = await staffContext.newPage();
      observeConsole(staff);
      staffPage = staff;
      staff.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
      await login(staff, "staff");
      await visible(staff.getByRole("heading", { name: "Inventory", exact: true }));
      assert.equal(await staff.getByRole("navigation").getByRole("button").count(), 1);
      assert.equal(
        await staff.getByRole("button", { name: "Add product", exact: true }).count(),
        0,
      );
      assert.equal((await api(staff, "history")).status, 403);
      assert.equal((await api(staff, "drafts")).status, 403);
      await staff.getByLabel("Search products").fill("Synthetic Widget Renamed");
      const row = staff
        .getByRole("list", { name: "Current warehouse stock" })
        .getByRole("listitem")
        .filter({ hasText: "Synthetic Widget Renamed" });
      await visible(row);
      await row.getByRole("button", { name: "Take", exact: true }).click();
      let dialog = staff.getByRole("dialog");
      await dialog.getByLabel(/Quantity/).fill("1");
      await dialog.getByRole("button", { name: /^Confirm/ }).click();
      await dialog.waitFor({ state: "hidden" });
      await visible(row.locator('[class*="stockNumber"] strong').filter({ hasText: /^7$/ }));
      await row.getByRole("button", { name: "Return", exact: true }).click();
      dialog = staff.getByRole("dialog");
      assert.match(await dialog.innerText(), /physically back in usable/);
      await dialog.getByLabel(/Quantity/).fill("1");
      await dialog.getByRole("button", { name: /^Confirm/ }).click();
      await dialog.waitFor({ state: "hidden" });
      await visible(row.locator('[class*="stockNumber"] strong').filter({ hasText: /^8$/ }));
      await row.getByRole("button", { name: "Take", exact: true }).click();
      dialog = staff.getByRole("dialog");
      await dialog.getByLabel(/Quantity/).fill("1");
      const p = (await api(staff, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await api(manager, "movements", "POST", {
        productId: p.id,
        type: "TAKE",
        quantity: p.stock,
        requestId: crypto.randomUUID(),
      });
      await dialog.getByRole("button", { name: /^Confirm/ }).click();
      await visible(dialog.getByRole("alert"));
      assert.match(await dialog.getByRole("alert").innerText(), /Not enough stock/);
      await staff.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await noOverflow(staff);
      await staff.screenshot({ path: join(artifacts, "staff-mobile-width.png"), fullPage: true });
      await staff.getByRole("button", { name: "Sign out", exact: true }).click();
      await visible(staff.getByRole("heading", { name: "Sign in to eStock" }));
      await staffContext.close();
    },
  );
  await check(
    "Stock activity filtering, Shared Staff/Manager Opening attribution and keyboard controls",
    async () => {
      await manager.getByRole("button", { name: "History", exact: true }).click();
      await manager.getByRole("button", { name: "Stock activity", exact: true }).click();
      await manager.getByLabel("Movement type").selectOption("TAKE");
      await manager.getByLabel("Search stock activity").fill("Shared Staff");
      await visible(manager.getByRole("article").filter({ hasText: "Shared Staff" }));
      assert.equal(await manager.getByRole("article").count(), 1);
      assert.match(await manager.getByRole("article").innerText(), /-1 pcs/);
      await manager.getByLabel("Movement type").selectOption("RETURN");
      assert.equal(await manager.getByRole("article").count(), 1);
      await manager.getByLabel("Search stock activity").fill("");
      await manager.getByLabel("Movement type").selectOption("OPENING");
      assert.equal(await manager.getByRole("article").count(), 4);
      assert.match(
        await manager.getByRole("article").first().innerText(),
        /Manager opening balance/,
      );
      assert.ok(!(await manager.getByRole("article").first().innerText()).includes("Shared Staff"));
      await manager.getByRole("button", { name: "Receipt history", exact: true }).focus();
      await manager.keyboard.press("Enter");
      await visible(manager.getByRole("heading", { name: "Receipt history", exact: true }));
      await manager.keyboard.press("Tab");
      assert.ok(await manager.evaluate(() => document.activeElement.matches(":focus-visible")));
      await noOverflow(manager);
      await manager.screenshot({ path: join(artifacts, "history-desktop.png"), fullPage: true });
    },
  );
  await check(
    "Long product names remain usable at 320px and keyboard dialog cancellation works",
    async () => {
      await manager.getByRole("button", { name: "Inventory", exact: true }).click();
      await createProduct(manager, `Long${"X".repeat(116)}`, 0);
      await manager.setViewportSize({ width: 320, height: 844 });
      await noOverflow(manager);
      await manager.getByRole("button", { name: "Add product", exact: true }).click();
      await manager.keyboard.press("Escape");
      await manager.getByRole("dialog").waitFor({ state: "hidden" });
      await manager.screenshot({
        path: join(artifacts, "inventory-long-name-320px.png"),
        fullPage: true,
      });
    },
  );
  await check(
    "Owned app-server restart preserves sessions, catalogue, drafts and receipt/activity ledger",
    async () => {
      const before = {
        products: await api(manager, "products"),
        drafts: await api(manager, "drafts"),
        history: await api(manager, "history"),
      };
      for (const product of before.products.body.products) {
        const total = before.history.body.movements
          .filter((m) => m.productId === product.id)
          .reduce((sum, m) => sum + m.delta, 0);
        assert.equal(product.stock, total);
      }
      await manager.close();
      preview.stdin.write("restart\n");
      for (let i = 0; i < 180; i++) {
        if (serverLog.includes("RESTART STARTED:")) {
          try {
            const r = await fetch(`${origin}/estock-test-preview-id.txt`, {
              signal: AbortSignal.timeout(500),
            });
            if (r.ok && (await r.text()) === identity) break;
          } catch {}
        }
        if (i === 179) throw new Error("Owned app-server restart did not become ready");
        await delay(200);
      }
      manager = await context.newPage();
      observeConsole(manager);
      manager.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
      await manager.goto(`${origin}/demo`);
      await visible(manager.getByRole("heading", { name: "Warehouse overview", exact: true }));
      assert.deepEqual(
        {
          products: await api(manager, "products"),
          drafts: await api(manager, "drafts"),
          history: await api(manager, "history"),
        },
        before,
      );
      await noOverflow(manager);
    },
  );
  assert.deepEqual(runtimeErrors, []);
  const unexpectedConsoleErrors = consoleDiagnostics.filter(
    (m) =>
      m.level === "error" && !/^Failed to load resource:.*status of (403|409|502)\b/.test(m.text),
  );
  assert.deepEqual(unexpectedConsoleErrors, []);
  console.log(
    `BROWSER SUMMARY: ${results.length} journeys passed in headless Chrome. Physical camera/mobile device/live Gemini not tested.`,
  );
} catch (error) {
  results.push({ scenario: step, result: "Fail", evidence: redact(error.message) });
  console.error(`BROWSER FAIL: ${step}: ${redact(error.message)}`);
  if (manager && !manager.isClosed())
    await manager
      .screenshot({ path: join(artifacts, "failure.png"), fullPage: true })
      .catch(() => {});
  if (staffPage && !staffPage.isClosed()) {
    await staffPage
      .screenshot({ path: join(artifacts, "staff-failure.png"), fullPage: true })
      .catch(() => {});
    console.error(
      "STAFF DEBUG:",
      redact(
        await staffPage
          .locator("body")
          .innerText()
          .catch(() => "Unavailable"),
      ),
    );
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (!hasExited()) {
    preview.stdin.write("stop\n");
  }
  await previewStopped;
  writeFileSync(join(artifacts, "preview.log"), redact(serverLog));
  console.log(
    serverLog.includes("CLEANUP PASS: owned preview schema removed.")
      ? "PREVIEW CLEANUP PASS"
      : "PREVIEW CLEANUP UNVERIFIED",
  );
  if (!serverLog.includes("CLEANUP PASS: owned preview schema removed.")) process.exitCode = 1;
  writeFileSync(
    join(artifacts, "results.json"),
    JSON.stringify(
      {
        results,
        runtimeErrors,
        consoleDiagnostics,
        physicalCamera: "Unverified",
        realMobileDevice: "Unverified",
        liveGemini: "Unverified",
      },
      null,
      2,
    ),
  );
}
