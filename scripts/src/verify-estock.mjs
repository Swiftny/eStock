import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

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
  assert.deepEqual(errors, []);
  console.info("PASS: landing, demo navigation, role selection, login redirect, mobile layout, signed-out APIs; no browser runtime errors.");
} finally {
  await browser.close();
}
