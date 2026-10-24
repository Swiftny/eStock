import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const base = "http://localhost:80";
const output = new URL("../../generated-artifacts/verification/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/repl/tools/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(base);
  await page.getByRole("heading", { name: /Less time typing/ }).waitFor();
  await page.getByRole("link", { name: "Open demo", exact: true }).first().click();
  await page.getByRole("heading", { name: "Sign in to eStock" }).waitFor();
  assert.equal(new URL(page.url()).pathname, "/demo");
  await page.getByRole("radio", { name: /Staff/ }).check();
  await page.getByRole("radio", { name: /Manager/ }).check();
  await page.screenshot({ path: new URL("signin-desktop.jpg", output).pathname });
  await page.goto(`${base}/login`);
  await page.waitForURL(`${base}/demo`);
  await page.getByRole("heading", { name: "Sign in to eStock" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: new URL("signin-mobile.jpg", output).pathname, fullPage: true });
  await page.goto(base);
  await page.getByRole("heading", { name: /Less time typing/ }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: new URL("landing-mobile.jpg", output).pathname, fullPage: true });
  const session = await page.request.get(`${base}/api/estock/session`);
  assert.deepEqual(await session.json(), { authenticated: false });
  assert.equal((await page.request.get(`${base}/api/estock/products`)).status(), 401);
  assert.equal((await page.request.post(`${base}/api/session`)).status(), 410);
  if (process.env.ESTOCK_MANAGER_PASSWORD && process.env.ESTOCK_STAFF_PASSWORD) {
    let testProduct;
    async function login(target, role) {
      await target.goto(`${base}/demo`);
      await target.getByRole("radio", { name: new RegExp(role, "i") }).check();
      // Values stay inside the test process and are never logged or saved.
      await target.getByLabel("Access code", { exact: true }).fill(
        process.env[role === "manager" ? "ESTOCK_MANAGER_PASSWORD" : "ESTOCK_STAFF_PASSWORD"],
      );
      const response = target.waitForResponse((r) =>
        r.url().endsWith("/api/estock/session") && r.request().method() === "POST");
      await target.getByRole("button", { name: "Sign in", exact: true }).click();
      const result = await response;
      assert.equal(result.status(), 200, `${role} sign-in failed: ${await result.text()}`);
      await target.waitForURL("**/demo#inventory");
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    const staffContext = await browser.newContext();
    const staff = await staffContext.newPage();
    try {
      await login(page, "manager");
      const name = `Migration Check ${randomUUID().slice(0, 8)}`;
      await page.getByRole("button", { name: "Add product", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Official product name").fill(name);
      await dialog.getByLabel("Opening stock", { exact: true }).fill("10");
      const creation = page.waitForResponse((r) =>
        r.url().endsWith("/api/estock/products") && r.request().method() === "POST");
      await dialog.getByRole("button", { name: "Add product", exact: true }).click();
      const created = await creation;
      assert.equal(created.status(), 201);
      testProduct = (await created.json()).product;
      await page.getByText(name, { exact: true }).waitFor();
      await page.reload();
      await page.getByText(name, { exact: true }).waitFor();
      await page.screenshot({ path: new URL("manager-inventory.jpg", output).pathname });

      await login(staff, "staff");
      await staff.getByText(name, { exact: true }).waitFor();
      const denied = await staff.request.post(`${base}/api/estock/products`, {
        data: { name: "Forbidden staff creation", unit: "pcs", openingStock: 0, requestId: randomUUID() },
      });
      assert.equal(denied.status(), 403);
      for (const [type, quantity, expected] of [["TAKE", 2, 8], ["RETURN", 1, 9]]) {
        const changed = await staff.request.post(`${base}/api/estock/movements`, {
          data: { productId: testProduct.id, type, quantity, requestId: randomUUID() },
        });
        assert.equal(changed.status(), 201);
        assert.equal((await changed.json()).product.stock, expected);
      }
      await staff.reload();
      await staff.getByText(name, { exact: true }).waitFor();
      await staff.screenshot({ path: new URL("staff-inventory.jpg", output).pathname });
      const list = await page.request.get(`${base}/api/estock/products`);
      const current = (await list.json()).products.find((item) => item.id === testProduct.id);
      assert.equal(current.stock, 9);
      for (const route of ["drafts", "receiving", "history", "notifications"]) {
        const response = await page.request.get(`${base}/api/estock/${route}`);
        assert.equal(response.status(), 200, `${route} failed`);
      }
      const logout = await staff.request.delete(`${base}/api/estock/session`);
      assert.equal(logout.status(), 200);
      assert.equal((await staff.request.get(`${base}/api/estock/products`)).status(), 401);
      console.info("PASS: Manager/Staff UI login, create-product UI, reload persistence, permissions, Take/Return API, shared stock, domain endpoints, sign-out.");
    } finally {
      if (testProduct) {
        const latest = await page.request.get(`${base}/api/estock/products`);
        const current = (await latest.json()).products.find((item) => item.id === testProduct.id);
        if (current) {
          const cleanup = await page.request.delete(`${base}/api/estock/products/${testProduct.id}`, {
            data: { expectedVersion: current.version, requestId: randomUUID() },
          });
          assert.equal(cleanup.status(), 200, "Could not clean up the generated test product");
        }
      }
      await page.request.delete(`${base}/api/estock/session`);
      await staffContext.close();
    }
  }
  assert.deepEqual(errors, []);
  console.info("PASS: landing, demo navigation, role selection, login redirect, mobile layout, signed-out APIs; no browser runtime errors.");
} catch (error) {
  // Playwright call logs can contain input text. Redact before printing failures.
  let detail = error instanceof Error ? error.message : String(error);
  for (const key of ["ESTOCK_MANAGER_PASSWORD", "ESTOCK_STAFF_PASSWORD", "ESTOCK_SESSION_SECRET", "GEMINI_API_KEY"]) {
    if (process.env[key]) detail = detail.split(process.env[key]).join("[redacted]");
  }
  console.error(detail);
  process.exitCode = 1;
} finally {
  await browser.close();
}
