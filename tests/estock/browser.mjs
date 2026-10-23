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
const contrastSamples = [];
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
  for (const page of [manager, staffPage])
    if (page && !page.isClosed()) {
      const sample = await page.evaluate(() => {
        const rgb = (value) => value.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
        const lum = (c) => {
          const v = c.slice(0, 3).map((x) => {
            x /= 255;
            return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
        };
        let min = 100,
          count = 0;
        const failures = [];
        for (const el of document.querySelectorAll("main *, header *, dialog *")) {
          if (!el.getClientRects().length || el.closest(":disabled")) continue;
          if (
            ![...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
          )
            continue;
          const style = getComputedStyle(el);
          if (style.visibility !== "visible") continue;
          const fg = rgb(style.color);
          let bg = [255, 255, 255];
          for (let parent = el; parent; parent = parent.parentElement) {
            const color = rgb(getComputedStyle(parent).backgroundColor);
            if (color.length === 3 || color[3] === 1) {
              bg = color;
              break;
            }
          }
          const a = lum(fg),
            b = lum(bg),
            ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            large =
              parseFloat(style.fontSize) >= 24 ||
              (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          min = Math.min(min, ratio);
          count++;
          if (ratio < (large ? 3 : 4.5))
            failures.push({ text: el.textContent.slice(0, 60), ratio });
        }
        return { count, min, failures };
      });
      contrastSamples.push({ scenario: name, ...sample });
      assert.deepEqual(sample.failures, []);
    }
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
  const staffContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await staffContext.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const staff = await staffContext.newPage();
  staffPage = staff;
  observeConsole(staff);
  staff.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
  async function navigate(page, name) {
    await page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("button", { name, exact: true })
      .click();
  }
  const row = (page, name) =>
    page
      .getByRole("list", { name: "Current warehouse stock" })
      .getByRole("listitem")
      .filter({ hasText: name });
  const snapshot = async () =>
    (await api(manager, "products")).body.products.map((p) => [p.id, p.stock]);
  await check(
    "Inventory home, role-specific header navigation and no redundant Back controls",
    async () => {
      await login(manager, "manager");
      await login(staff, "staff");
      for (const page of [manager, staff]) {
        await visible(page.getByRole("heading", { name: "Inventory", exact: true }));
        const nav = page.getByRole("navigation", { name: "Workspace sections" });
        assert.deepEqual(
          await nav.getByRole("button").allTextContents(),
          page === manager
            ? ["Inventory", "Scan receipt", "Drafts", "History"]
            : ["Inventory", "Pending checks"],
        );
        assert.equal(await page.getByRole("button", { name: /^Back to/ }).count(), 0);
        assert.equal(await page.getByRole("button", { name: "Sign out", exact: true }).count(), 0);
        assert.equal(await page.getByText("Recent activity", { exact: true }).count(), 0);
        await page.getByRole("button", { name: /^Notifications/ }).click();
        await visible(page.getByText("No notifications yet.", { exact: true }));
        await page.keyboard.press("Escape");
        await noOverflow(page);
      }
      await navigate(manager, "History");
      await visible(manager.getByRole("heading", { name: "No completed receipts yet" }));
      await manager.getByRole("button", { name: "Stock activity", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "No stock activity yet" }));
      await navigate(manager, "Inventory");
      await visible(manager.getByRole("heading", { name: "No products yet" }));
      await navigate(staff, "Pending checks");
      await visible(staff.getByText("No receipts waiting for a physical check.", { exact: true }));
    },
  );
  await check("Product setup, search, rename and zero/Low stock states", async () => {
    await createProduct(manager, "Synthetic Widget", 5);
    await createProduct(manager, "Synthetic Zero", 0);
    await createProduct(manager, "Synthetic Four", 4);
    await manager.getByLabel("Search products").fill("sYnThEtIc wIdGeT");
    const widget = row(manager, "Synthetic Widget");
    await visible(widget);
    await widget.getByRole("button", { name: "Edit", exact: true }).click();
    const dialog = manager.getByRole("dialog");
    await dialog.getByLabel("Official product name").fill("Synthetic Widget Renamed");
    await dialog.getByRole("button", { name: "Save name", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await manager.getByLabel("Search products").fill("");
    assert.match(await row(manager, "Synthetic Zero").innerText(), /Out of stock/);
    assert.equal(
      await row(manager, "Synthetic Zero")
        .getByRole("button", { name: "Take", exact: true })
        .isDisabled(),
      true,
    );
    assert.match(await row(manager, "Synthetic Four").innerText(), /Low stock/);
  });
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
      "Unreadable non-stock line",
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
  async function scan() {
    await navigate(manager, "Scan receipt");
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    return (await api(manager, "drafts")).body.drafts.find((d) => d.status === "DRAFT");
  }
  let firstDraft;
  await check(
    "Stub OCR, temporary image comparison, reload and draft saving never post stock",
    async () => {
      const before = await snapshot();
      firstDraft = await scan();
      assert.deepEqual(await snapshot(), before);
      await manager.getByText("Compare with a bon image", { exact: true }).click();
      const posts = draftPosts;
      await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
      await visible(
        manager.getByAltText("Temporary bon image for comparison with the saved draft"),
      );
      await manager
        .getByLabel("Upload a receipt image")
        .setInputFiles({ ...payload, name: "changed.png" });
      await manager.getByRole("button", { name: "Remove image", exact: true }).click();
      assert.equal(draftPosts, posts);
      await manager.setViewportSize({ width: 375, height: 812 });
      await noOverflow(manager);
      await manager.screenshot({ path: join(artifacts, "draft-mobile-width.png"), fullPage: true });
      await manager.reload();
      await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
      assert.equal(
        await manager
          .getByAltText("Temporary bon image for comparison with the saved draft")
          .count(),
        0,
      );
      await manager.setViewportSize({ width: 1280, height: 900 });
      const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
      await manager.getByLabel("Document date for this intake").fill("2026-10-03");
      const product = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await lines.nth(0).getByLabel("Official product").selectOption(product.id);
      await lines
        .nth(0)
        .getByLabel(/Expected quantity/)
        .fill("2");
      await lines.nth(1).getByRole("button", { name: "Create new product", exact: true }).click();
      const dialog = manager.getByRole("dialog");
      await dialog.getByLabel("Official product name").fill("Synthetic Lamp");
      assert.equal(await dialog.getByLabel("Opening stock").count(), 0);
      await dialog.getByRole("button", { name: "Add product", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await lines
        .nth(1)
        .getByLabel(/Expected quantity/)
        .fill("24");
      await lines.nth(2).getByLabel("Exclude this line from Intake").check();
      await lines
        .nth(2)
        .getByLabel("Reason for excluding this line")
        .fill("Unreadable non-stock line");
      await manager.getByRole("button", { name: "Save draft", exact: true }).click();
      await visible(manager.getByText("Draft saved. Stock has not changed.", { exact: true }));
      assert.equal(
        (await api(manager, "products")).body.products.find((p) => p.name === "Synthetic Lamp")
          .stock,
        0,
      );
      const saved = (await api(manager, `drafts/${firstDraft.id}`)).body.draft;
      assert.equal(saved.lines[1].rawQuantity, 2);
      assert.equal(saved.lines[1].approvedQuantity, 24);
    },
  );
  await check(
    "Send to Staff freezes details with no stock change; persisted Staff notification opens check",
    async () => {
      const before = await snapshot();
      await manager.getByRole("button", { name: "Send to Staff", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Awaiting Staff check", exact: true }));
      assert.deepEqual(await snapshot(), before);
      assert.equal(await manager.getByRole("button", { name: "Approve stock intake" }).count(), 0);
      assert.equal(
        (
          await api(manager, `drafts/${firstDraft.id}`, "PATCH", {
            expectedRevision: 1,
            documentDate: "2026-10-03",
            lines: [],
          })
        ).status,
        400,
      );
      await staff.evaluate(() => window.dispatchEvent(new Event("focus")));
      await visible(staff.getByRole("button", { name: "Notifications, 1 unread" }));
      await staff.reload();
      await visible(staff.getByRole("button", { name: "Notifications, 1 unread" }));
      await staff.getByRole("button", { name: /^Notifications/ }).click();
      await visible(staff.getByText("Receipt ready to check", { exact: true }));
      await staff.getByRole("button", { name: "Open receiving check", exact: true }).click();
      await visible(staff.getByRole("heading", { name: "Synthetic Lamp", exact: true }));
      assert.match(await staff.locator("main").innerText(), /Expected: 24 pcs/);
      await noOverflow(staff);
      await staff.screenshot({
        path: join(artifacts, "staff-receiving-375px.png"),
        fullPage: true,
      });
      await navigate(staff, "Inventory");
      await visible(staff.getByRole("heading", { name: "Inventory", exact: true }));
      await staff.goBack();
      await visible(staff.getByRole("heading", { name: "Receiving check", exact: true }));
    },
  );
  await check(
    "Staff differences preview does not mutate stock; final check immediately posts actual 1/27",
    async () => {
      const before = await snapshot();
      await staff.getByRole("button", { name: "Report differences", exact: true }).click();
      await staff
        .getByLabel("Report a difference for Synthetic Widget Renamed", { exact: true })
        .check();
      await staff
        .getByLabel("Difference quantity for Synthetic Widget Renamed", { exact: true })
        .fill("3");
      await visible(
        staff.getByText("Enter a positive whole difference. Shortage cannot exceed 2.", {
          exact: true,
        }),
      );
      assert.equal(
        await staff
          .getByRole("button", { name: "Confirm received goods", exact: true })
          .isDisabled(),
        true,
      );
      await staff
        .getByLabel("Difference quantity for Synthetic Widget Renamed", { exact: true })
        .fill("1");
      await staff.getByLabel("Report a difference for Synthetic Lamp", { exact: true }).check();
      await staff
        .getByLabel("Difference for Synthetic Lamp", { exact: true })
        .selectOption("EXTRA");
      await staff.getByLabel("Difference quantity for Synthetic Lamp", { exact: true }).fill("3");
      assert.match(await staff.locator("main").innerText(), /Actually received: 27 pcs/);
      assert.deepEqual(await snapshot(), before);
      await staff.getByRole("button", { name: "Confirm received goods", exact: true }).click();
      await visible(staff.getByText(/Shared Staff checked.*Stock posted/));
      const products = (await api(manager, "products")).body.products;
      assert.equal(products.find((p) => p.name === "Synthetic Widget Renamed").stock, 6);
      assert.equal(products.find((p) => p.name === "Synthetic Lamp").stock, 27);
      await staff.reload();
      await visible(staff.getByText(/Stock posted at confirmation/));
      assert.equal(
        await staff.getByRole("button", { name: "Confirm received goods", exact: true }).count(),
        0,
      );
      await staff.getByRole("button", { name: /^Notifications/ }).click();
      await visible(staff.getByText("Receiving check closed", { exact: true }));
      assert.equal(
        await staff.getByRole("button", { name: "Open receiving check", exact: true }).count(),
        0,
      );
      await staff.keyboard.press("Escape");
      await navigate(staff, "Pending checks");
      await visible(staff.getByText("No receipts waiting for a physical check.", { exact: true }));
    },
  );
  await check(
    "Manager informational discrepancy alert, read state, quantity details and Inventory navigation",
    async () => {
      await manager.evaluate(() => window.dispatchEvent(new Event("focus")));
      await visible(manager.getByRole("button", { name: "Notifications, 1 unread" }));
      await manager.getByRole("button", { name: /^Notifications/ }).click();
      await visible(manager.getByText("Receipt differences reported", { exact: true }).first());
      const beforeRead = await snapshot();
      await manager.getByRole("button", { name: "Mark read", exact: true }).click();
      await visible(manager.getByRole("button", { name: "Notifications, 0 unread" }));
      assert.deepEqual(await snapshot(), beforeRead);
      await manager.getByRole("button", { name: "View receipt differences", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Synthetic Lamp", exact: true }));
      const text = await manager.locator("main").innerText();
      assert.match(text, /Expected: 24 pcs/);
      assert.match(text, /Extra by 3.*Actually received: 27 pcs/);
      assert.equal(await manager.getByRole("button", { name: /Approve/ }).count(), 0);
      await manager.reload();
      await visible(manager.getByRole("heading", { name: "Receiving check", exact: true }));
      await visible(manager.getByRole("button", { name: "Notifications, 0 unread" }));
      await navigate(manager, "Inventory");
      await visible(manager.getByRole("heading", { name: "Inventory", exact: true }));
      assert.equal(await manager.getByText("Recent activity", { exact: true }).count(), 0);
    },
  );
  await check("All items match confirmation and same-date receipt History grouping", async () => {
    const second = await scan();
    const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
    const p = (await api(manager, "products")).body.products.find(
      (p) => p.name === "Synthetic Widget Renamed",
    );
    await manager.getByLabel("Document date for this intake").fill("2026-10-03");
    await lines.nth(0).getByLabel("Official product").selectOption(p.id);
    await lines
      .nth(0)
      .getByLabel(/Expected quantity/)
      .fill("1");
    for (const index of [1, 2]) {
      await lines.nth(index).getByLabel("Exclude this line from Intake").check();
      await lines.nth(index).getByLabel("Reason for excluding this line").fill("Non-stock line");
    }
    await manager.getByRole("button", { name: "Send to Staff", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Awaiting Staff check", exact: true }));
    await navigate(staff, "Pending checks");
    await staff.getByRole("button", { name: /Synthetic Widget Renamed.*Check goods/ }).click();
    await visible(staff.getByRole("button", { name: "All items match", exact: true }));
    await staff.getByRole("button", { name: "All items match", exact: true }).click();
    await staff.getByRole("button", { name: "Confirm received goods", exact: true }).click();
    await visible(staff.getByText(/Stock posted at confirmation/));
    assert.equal(
      (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      ).stock,
      7,
    );
    assert.equal(
      (await api(manager, "notifications")).body.notifications.filter(
        (n) => n.receiptId === second.id,
      ).length,
      0,
    );
    await navigate(manager, "History");
    await visible(manager.getByText("2 of 2 completed receipts", { exact: true }));
    await manager.getByLabel("Search receipts").fill("Synthetic Lamp");
    await visible(manager.getByText("1 of 2 completed receipts", { exact: true }));
    await manager.getByText("View receipt details", { exact: true }).click();
    assert.match(await manager.getByRole("article").innerText(), /2 boxes/);
    assert.match(await manager.getByRole("article").innerText(), /Shared Staff received 27 pcs/);
    await manager.getByLabel("Document date", { exact: true }).fill("2026-10-04");
    await visible(manager.getByRole("heading", { name: "No matching receipts", exact: true }));
    await manager.getByLabel("Document date", { exact: true }).fill("");
    await manager.getByLabel("Search receipts").fill("");
    await manager.setViewportSize({ width: 320, height: 812 });
    await noOverflow(manager);
    await manager.screenshot({
      path: join(artifacts, "receipt-history-mobile-width.png"),
      fullPage: true,
    });
    await manager.setViewportSize({ width: 1280, height: 900 });
  });
  await check("Provider error has deliberate retry; discard remains stock-neutral", async () => {
    await navigate(manager, "Scan receipt");
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    const before = await snapshot(),
      posts = draftPosts;
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByRole("alert"));
    assert.equal(draftPosts, posts + 1);
    assert.deepEqual(await snapshot(), before);
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    await manager.getByRole("button", { name: "Discard draft", exact: true }).click();
    await manager.getByRole("button", { name: "Yes, discard draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Discarded draft", exact: true }));
    assert.deepEqual(await snapshot(), before);
  });
  await check(
    "Entirely missing delivery records actual zero in History without Intake",
    async () => {
      const before = await snapshot(),
        draft = await scan();
      const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
      const p = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await lines.nth(0).getByLabel("Official product").selectOption(p.id);
      await lines
        .nth(0)
        .getByLabel(/Expected quantity/)
        .fill("2");
      for (const index of [1, 2]) {
        await lines.nth(index).getByLabel("Exclude this line from Intake").check();
        await lines.nth(index).getByLabel("Reason for excluding this line").fill("Non-stock line");
      }
      await manager.getByRole("button", { name: "Send to Staff", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Awaiting Staff check", exact: true }));
      await navigate(staff, "Pending checks");
      await staff.getByRole("button", { name: /Synthetic Widget Renamed.*Check goods/ }).click();
      await visible(staff.getByRole("heading", { name: "Synthetic Widget Renamed", exact: true }));
      await staff.getByRole("button", { name: "Report differences", exact: true }).click();
      await staff
        .getByLabel("Report a difference for Synthetic Widget Renamed", { exact: true })
        .check();
      await staff
        .getByLabel("Difference quantity for Synthetic Widget Renamed", { exact: true })
        .fill("2");
      await visible(staff.getByText("Actually received: 0 pcs", { exact: true }));
      await staff.getByRole("button", { name: "Confirm received goods", exact: true }).click();
      await visible(staff.getByText(/Stock posted at confirmation/));
      assert.deepEqual(await snapshot(), before);
      assert.equal(
        (await api(manager, "history")).body.movements.filter((m) => m.draftId === draft.id).length,
        0,
      );
      assert.equal(
        (await api(manager, "receiving")).body.receipts.find((r) => r.id === draft.id).lines[0]
          .actual,
        0,
      );
      await navigate(manager, "History");
      await visible(manager.getByText("3 of 3 completed receipts", { exact: true }));
      await visible(manager.getByText(/0 pcs received · expected 2/));
    },
  );
  await check(
    "Both roles Take bounds typed input, empty editing, stepper max, Return and stale stock refresh",
    async () => {
      for (const [page, name] of [
        [manager, "Inventory"],
        [staff, "Inventory"],
      ]) {
        await navigate(page, name);
        const widget = row(page, "Synthetic Widget Renamed");
        await widget.getByRole("button", { name: "Take", exact: true }).click();
        let dialog = page.getByRole("dialog"),
          input = dialog.getByLabel(/Quantity/);
        const available = Number(await input.getAttribute("max"));
        await input.fill(String(available + 1));
        assert.equal(await input.getAttribute("aria-invalid"), "true");
        assert.equal(
          await dialog.getByRole("button", { name: "Confirm Take", exact: true }).isDisabled(),
          true,
        );
        await visible(
          dialog.getByText(`Enter a positive whole number up to ${available}.`, { exact: true }),
        );
        await input.fill("");
        assert.equal(await input.inputValue(), "");
        await input.fill(String(available));
        await input.press("ArrowUp");
        assert.equal(Number(await input.inputValue()), available);
        await input.fill("1");
        await dialog.getByRole("button", { name: "Confirm Take", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await widget.getByRole("button", { name: "Return", exact: true }).click();
        dialog = page.getByRole("dialog");
        assert.equal(await dialog.getByLabel(/Quantity/).getAttribute("max"), null);
        await dialog.getByLabel(/Quantity/).fill("1");
        await dialog.getByRole("button", { name: "Confirm Return", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await noOverflow(page);
      }
      await row(staff, "Synthetic Widget Renamed")
        .getByRole("button", { name: "Take", exact: true })
        .click();
      const dialog = staff.getByRole("dialog");
      await dialog.getByLabel(/Quantity/).fill("1");
      const p = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await api(manager, "movements", "POST", {
        productId: p.id,
        type: "TAKE",
        quantity: p.stock,
        requestId: crypto.randomUUID(),
      });
      await dialog.getByRole("button", { name: "Confirm Take", exact: true }).click();
      await visible(dialog.getByRole("alert").filter({ hasText: "Not enough stock" }));
      await visible(
        dialog
          .getByText("Available: 0 pcs", { exact: true })
          .or(dialog.getByText("Enter a positive whole number up to 0.", { exact: true })),
      );
      assert.equal(
        await dialog.getByRole("button", { name: "Confirm Take", exact: true }).isDisabled(),
        true,
      );
      await staff.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await row(staff, "Synthetic Widget Renamed")
          .getByRole("button", { name: "Take", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal((await api(staff, "history")).status, 403);
      assert.equal((await api(staff, "drafts")).status, 403);
    },
  );
  await check(
    "Delete one accessible dialog: keyboard Cancel, persistence with remaining stock and retained History",
    async () => {
      await navigate(manager, "Inventory");
      const lamp = row(manager, "Synthetic Lamp");
      await lamp.getByRole("button", { name: "Delete Synthetic Lamp", exact: true }).click();
      let dialog = manager.getByRole("dialog");
      assert.equal(await dialog.count(), 1);
      assert.match(await dialog.innerText(), /27 pcs/);
      assert.match(await dialog.innerText(), /history.*retained/);
      await dialog.getByRole("button", { name: "Cancel", exact: true }).focus();
      await manager.keyboard.press("Enter");
      await dialog.waitFor({ state: "hidden" });
      await visible(lamp);
      await lamp.getByRole("button", { name: "Delete Synthetic Lamp", exact: true }).click();
      dialog = manager.getByRole("dialog");
      let failDelete = true;
      await manager.route("**/api/estock/products/*", async (route) => {
        if (route.request().method() !== "DELETE") return route.continue();
        if (failDelete) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Synthetic delete outage" }),
          });
        } else {
          await delay(200);
          await route.continue();
        }
      });
      await dialog.getByRole("button", { name: "Delete", exact: true }).click();
      await visible(dialog.getByRole("alert"));
      await visible(lamp);
      failDelete = false;
      await dialog.getByRole("button", { name: "Delete", exact: true }).click();
      await visible(dialog.getByRole("button", { name: "Deleting…", exact: true }));
      assert.equal(
        await dialog.getByRole("button", { name: "Deleting…", exact: true }).isDisabled(),
        true,
      );
      await dialog.waitFor({ state: "hidden" });
      await manager.unroute("**/api/estock/products/*");
      await lamp.waitFor({ state: "hidden" });
      await manager.reload();
      await visible(manager.getByRole("heading", { name: "Inventory", exact: true }));
      assert.equal(await row(manager, "Synthetic Lamp").count(), 0);
      assert.equal(await staff.getByRole("button", { name: /^Delete/ }).count(), 0);
      await navigate(manager, "History");
      await manager.getByLabel("Search receipts").fill("Synthetic Lamp");
      await visible(manager.getByRole("article").filter({ hasText: "Synthetic Lamp" }));
    },
  );
  await check(
    "Archived pending receipt requires Manager recall/correction and explicit Staff reopen",
    async () => {
      await navigate(manager, "Inventory");
      await createProduct(manager, "Synthetic pending lamp", 3);
      const draft = await scan();
      const lines = manager.locator('[class*="draftLines"] > [class*="draftLine"]');
      const p = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic pending lamp",
      );
      await lines.nth(0).getByLabel("Official product").selectOption(p.id);
      await lines
        .nth(0)
        .getByLabel(/Expected quantity/)
        .fill("2");
      for (const i of [1, 2]) {
        await lines.nth(i).getByLabel("Exclude this line from Intake").check();
        await lines.nth(i).getByLabel("Reason for excluding this line").fill("Non-stock line");
      }
      await manager.getByRole("button", { name: "Send to Staff", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Awaiting Staff check", exact: true }));
      await navigate(staff, "Pending checks");
      await staff.getByRole("button", { name: /Synthetic pending lamp.*Check goods/ }).click();
      await visible(staff.getByRole("heading", { name: "Synthetic pending lamp", exact: true }));
      await staff.getByRole("button", { name: "Report differences", exact: true }).click();
      await staff
        .getByLabel("Report a difference for Synthetic pending lamp", { exact: true })
        .check();
      await staff
        .getByLabel("Difference quantity for Synthetic pending lamp", { exact: true })
        .fill("1");
      await navigate(manager, "Inventory");
      await row(manager, "Synthetic pending lamp")
        .getByRole("button", { name: "Delete Synthetic pending lamp", exact: true })
        .click();
      await manager
        .getByRole("dialog")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await manager.getByRole("dialog").waitFor({ state: "hidden" });
      await staff.getByRole("button", { name: "Confirm received goods", exact: true }).click();
      await visible(staff.getByRole("alert").filter({ hasText: "A receipt product was deleted" }));
      await navigate(manager, "Drafts");
      await visible(manager.getByRole("button", { name: "Recall to correct", exact: true }));
      await manager.getByRole("button", { name: "Recall to correct", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
      const replacement = (await api(manager, "products")).body.products.find(
        (p) => p.name === "Synthetic Widget Renamed",
      );
      await manager
        .locator('[class*="draftLines"] > [class*="draftLine"]')
        .nth(0)
        .getByLabel("Official product")
        .selectOption(replacement.id);
      await manager
        .locator('[class*="draftLines"] > [class*="draftLine"]')
        .nth(0)
        .getByLabel(/Expected quantity/)
        .fill("4");
      await manager.getByRole("button", { name: "Send to Staff", exact: true }).click();
      await visible(manager.getByRole("heading", { name: "Awaiting Staff check", exact: true }));
      await staff.evaluate(() => window.dispatchEvent(new Event("focus")));
      await visible(staff.getByRole("button", { name: "Reopen latest check", exact: true }));
      assert.equal(
        await staff
          .getByRole("button", { name: "Confirm received goods", exact: true })
          .isDisabled(),
        true,
      );
      await visible(staff.getByRole("heading", { name: "Synthetic pending lamp", exact: true }));
      assert.match(await staff.locator("main").innerText(), /Expected: 2 pcs/);
      await staff.getByRole("button", { name: "Reopen latest check", exact: true }).click();
      await visible(staff.getByRole("heading", { name: "Synthetic Widget Renamed", exact: true }));
      assert.match(await staff.locator("main").innerText(), /Expected: 4 pcs/);
      assert.equal(
        await staff
          .getByRole("button", { name: "All items match", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await staff.getByRole("button", { name: "Confirm received goods", exact: true }).click();
      await visible(staff.getByText(/Stock posted at confirmation/));
      assert.equal(
        (await api(manager, "products")).body.products.find((p) => p.id === replacement.id).stock,
        4,
      );
      assert.equal((await api(manager, `drafts/${draft.id}`)).body.draft.status, "RECEIVED");
    },
  );
  await check(
    "Notification error/retry, polling without overlap, keyboard focus and mobile/reduced motion",
    async () => {
      let fail = true;
      await manager.route("**/api/estock/notifications", async (route) => {
        if (fail) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Synthetic notification outage" }),
          });
        } else await route.continue();
      });
      await manager.getByRole("button", { name: /^Notifications/ }).click();
      await visible(manager.getByText("Synthetic notification outage", { exact: true }));
      fail = false;
      await manager.getByRole("button", { name: "Retry notifications", exact: true }).click();
      await manager
        .getByText("Synthetic notification outage", { exact: true })
        .waitFor({ state: "hidden" });
      await visible(manager.getByText("Receipt differences reported", { exact: true }).first());
      await manager.keyboard.press("Escape");
      await manager.unroute("**/api/estock/notifications");
      let calls = 0,
        activePolls = 0,
        maxPolls = 0;
      await manager.route("**/api/estock/notifications", async (route) => {
        calls++;
        activePolls++;
        maxPolls = Math.max(maxPolls, activePolls);
        await delay(700);
        await route.continue();
        activePolls--;
      });
      const refreshed = manager.waitForResponse((r) =>
        r.url().endsWith("/api/estock/notifications"),
      );
      await manager.getByRole("button", { name: /^Notifications/ }).click();
      await visible(manager.getByText("Loading notifications…", { exact: true }));
      await manager.evaluate(() => {
        for (let i = 0; i < 8; i++) window.dispatchEvent(new Event("focus"));
      });
      await refreshed;
      await manager.getByRole("button", { name: "Close notifications", exact: true }).click();
      assert.equal(calls, 1);
      assert.equal(maxPolls, 1);
      await manager.unroute("**/api/estock/notifications");
      for (const page of [manager, staff]) {
        await navigate(page, "Inventory");
        for (const width of [320, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 812 });
          await noOverflow(page);
        }
        await page.setViewportSize({ width: 320, height: 812 });
        for (const feature of page === manager
          ? ["Inventory", "Scan receipt", "Drafts", "History"]
          : ["Inventory", "Pending checks"]) {
          await navigate(page, feature);
          await noOverflow(page);
          assert.equal(await page.getByRole("button", { name: /^Back to/ }).count(), 0);
        }
        await navigate(page, "Inventory");
        await page.setViewportSize({ width: 812, height: 375 });
        await noOverflow(page);
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
          await page
            .locator('[class*="screen"]')
            .evaluate((el) => getComputedStyle(el).animationName),
          "none",
        );
        await page.keyboard.press("Tab");
        await page.getByRole("button", { name: /^Notifications/ }).focus();
        assert.equal(
          await page.evaluate(() => document.activeElement.matches(":focus-visible")),
          true,
        );
        await page.keyboard.press("Enter");
        await visible(page.getByRole("dialog"));
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.screenshot({
          path: join(
            artifacts,
            page === manager ? "manager-stockroom-375px.png" : "staff-stockroom-375px.png",
          ),
          fullPage: true,
        });
      }
    },
  );
  await check(
    "Public landing keeps supplied hero/layout and links to the working demo",
    async () => {
      const page = await context.newPage();
      observeConsole(page);
      page.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
      await page.goto(`${origin}/`);
      assert.match(await page.locator("h1").innerText(), /Less time typing/);
      assert.match(await page.locator("h1").innerText(), /Faster stock updates/);
      assert.match(await page.title(), /Faster stock updates/);
      assert.ok(await page.locator('a[href="/demo"]').count());
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await noOverflow(page);
      }
      await page.screenshot({ path: join(artifacts, "landing-preserved.png"), fullPage: true });
      await page.close();
    },
  );
  await check(
    "Owned server restart preserves sessions, receipt checks, notifications and ledger",
    async () => {
      const before = {
        products: await api(manager, "products"),
        drafts: await api(manager, "drafts"),
        history: await api(manager, "history"),
        notifications: await api(manager, "notifications"),
        receipts: await api(manager, "receiving"),
      };
      await staff.goto("about:blank");
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
        if (i === 179) throw new Error("Restart timeout");
        await delay(200);
      }
      manager = await context.newPage();
      observeConsole(manager);
      manager.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
      await manager.goto(`${origin}/demo`);
      await visible(manager.getByRole("heading", { name: "Inventory", exact: true }));
      assert.deepEqual(
        {
          products: await api(manager, "products"),
          drafts: await api(manager, "drafts"),
          history: await api(manager, "history"),
          notifications: await api(manager, "notifications"),
          receipts: await api(manager, "receiving"),
        },
        before,
      );
      await staff.goto(`${origin}/demo`);
      await visible(staff.getByRole("heading", { name: "Inventory", exact: true }));
      await staff.goto(origin);
      await staff.getByRole("button", { name: "Sign out", exact: true }).click();
      await visible(staff.getByRole("link", { name: "Sign in", exact: true }));
      await staff.getByRole("link", { name: "Sign in", exact: true }).click();
      await visible(staff.getByRole("heading", { name: "Sign in to eStock" }));
      await staffContext.close();
    },
  );
  assert.deepEqual(runtimeErrors, []);
  const unexpectedConsoleErrors = consoleDiagnostics.filter(
    (m) =>
      m.level === "error" &&
      !/^Failed to load resource:.*status of (400|403|409|502|503)\b/.test(m.text),
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
        contrastSamples,
        physicalCamera: "Unverified",
        realMobileDevice: "Unverified",
        liveGemini: "Unverified",
      },
      null,
      2,
    ),
  );
}
