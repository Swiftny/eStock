import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const origin = "http://127.0.0.1:3107";
const browserChannel = process.env.ESTOCK_BROWSER_CHANNEL || "chrome";
assert.ok(["chrome", "msedge"].includes(browserChannel), "Use chrome or msedge browser channel");
const secrets = [
  process.env.ESTOCK_MANAGER_PASSWORD,
  process.env.ESTOCK_STAFF_PASSWORD,
  process.env.ESTOCK_SESSION_SECRET,
  process.env.GEMINI_API_KEY,
].filter(Boolean);
const redact = (text) =>
  secrets.reduce((safe, secret) => safe.split(secret).join("[redacted]"), String(text));
const artifacts = join(
  process.cwd(),
  ".artifacts",
  browserChannel === "chrome" ? "estock-mvp" : `estock-mvp-${browserChannel}`,
);
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
  browser = await chromium.launch({
    channel: browserChannel,
    headless: true,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.grantPermissions(["camera"], { origin });
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
  const managedRow = (page, name) =>
    page
      .getByRole("list", { name: "Products to manage" })
      .getByRole("listitem")
      .filter({ hasText: name });
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
    await manager.getByRole("button", { name: "Manage products", exact: true }).click();
    const widget = managedRow(manager, "Synthetic Widget");
    await visible(widget);
    await widget.getByRole("button", { name: "Edit", exact: true }).click();
    const dialog = manager.getByRole("dialog");
    await dialog.getByLabel("Official product name").fill("Synthetic Widget Renamed");
    await dialog.getByRole("button", { name: "Save name", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await manager.getByLabel("Search products").fill("");
    await navigate(manager, "Inventory");
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
  await check("Simulated camera, retake Cancel, Remove and upload on a narrow screen", async () => {
    await navigate(manager, "Scan receipt");
    await manager.waitForTimeout(550);
    await manager.screenshot({ path: join(artifacts, "scan-desktop.png"), fullPage: true });
    await manager.setViewportSize({ width: 375, height: 812 });
    await manager.getByRole("button", { name: "Take photo", exact: true }).click();
    await visible(manager.getByLabel("Live receipt camera preview"));
    await manager.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find(
        (item) => item.textContent?.trim() === "Take picture",
      );
      return button && !button.disabled;
    });
    await noOverflow(manager);
    await manager.screenshot({ path: join(artifacts, `${browserChannel}-fake-camera-375px.png`) });
    await manager.getByRole("button", { name: "Take picture", exact: true }).click();
    const previewImage = manager.getByAltText(
      "Selected receipt for review before creating a draft",
    );
    await visible(previewImage);
    const captured = await previewImage.evaluate(async (image) => {
      const blob = await (await fetch(image.src)).blob();
      const signature = [...new Uint8Array(await blob.slice(0, 3).arrayBuffer())];
      const bitmap = await createImageBitmap(blob);
      const result = {
        mimeType: blob.type,
        bytes: blob.size,
        signature,
        width: bitmap.width,
        height: bitmap.height,
      };
      bitmap.close();
      return result;
    });
    assert.equal(captured.mimeType, "image/jpeg");
    assert.ok(captured.bytes > 1000, "Captured camera JPEG should contain image bytes");
    assert.deepEqual(captured.signature, [0xff, 0xd8, 0xff]);
    assert.ok(captured.width > 0 && captured.height > 0, "Captured JPEG must decode to pixels");
    await manager.getByRole("button", { name: "Retake photo", exact: true }).click();
    await visible(manager.getByRole("button", { name: "Cancel camera", exact: true }));
    await manager.getByRole("button", { name: "Cancel camera", exact: true }).click();
    await visible(previewImage);
    await manager.waitForFunction(
      () => document.activeElement?.textContent?.trim() === "Retake photo",
    );
    await manager.getByRole("button", { name: "Remove image", exact: true }).click();
    await previewImage.waitFor({ state: "hidden" });
    assert.equal(await manager.getByRole("button", { name: "Create draft" }).isDisabled(), true);
    await manager.getByRole("button", { name: "Take photo", exact: true }).click();
    await visible(manager.getByRole("button", { name: "Cancel camera", exact: true }));
    await manager.getByRole("button", { name: "Cancel camera", exact: true }).click();
    await manager.waitForFunction(
      () => document.activeElement?.textContent?.trim() === "Take photo",
    );
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    await visible(previewImage);
    await manager.getByRole("button", { name: "Remove image", exact: true }).click();
    await previewImage.waitFor({ state: "hidden" });
    await noOverflow(manager);
    await manager.setViewportSize({ width: 1280, height: 900 });
  });
  await check("Camera permission denial and missing device keep upload available", async () => {
    await navigate(manager, "Scan receipt");
    await manager.evaluate(() => {
      const original = navigator.mediaDevices.getUserMedia;
      window.__cameraFailureName = "NotAllowedError";
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () =>
          Promise.reject(new DOMException("Synthetic camera failure", window.__cameraFailureName)),
      });
      window.__restoreGetUserMedia = () =>
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
          configurable: true,
          value: original,
        });
    });
    try {
      for (const [failure, expected] of [
        ["NotAllowedError", "Camera permission was denied"],
        ["NotFoundError", "No usable camera was found"],
      ]) {
        await manager.evaluate((name) => {
          window.__cameraFailureName = name;
        }, failure);
        await manager.getByRole("button", { name: "Take photo", exact: true }).click();
        await visible(manager.getByRole("alert").filter({ hasText: expected }));
        await manager.waitForFunction(
          () => document.activeElement?.textContent?.trim() === "Take photo",
        );
        assert.equal(await manager.getByRole("button", { name: "Upload file" }).isEnabled(), true);
      }
    } finally {
      await manager.evaluate(() => window.__restoreGetUserMedia?.());
    }
  });
  await check("Multiple camera sources can switch without losing the capture flow", async () => {
    await navigate(manager, "Scan receipt");
    await manager.evaluate(() => {
      const originalMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      const originalDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      window.__requestedCameraIds = [];
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: (constraints) => {
          window.__requestedCameraIds.push(constraints.video?.deviceId?.exact || "default");
          return originalMedia({
            ...constraints,
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          });
        },
      });
      Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
        configurable: true,
        value: async () => [
          { kind: "videoinput", deviceId: "synthetic-front", label: "Synthetic front camera" },
          { kind: "videoinput", deviceId: "synthetic-back", label: "Synthetic back camera" },
        ],
      });
      window.__restoreCameraSelection = () => {
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
          configurable: true,
          value: originalMedia,
        });
        Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
          configurable: true,
          value: originalDevices,
        });
      };
    });
    try {
      await manager.getByRole("button", { name: "Take photo", exact: true }).click();
      await visible(manager.getByRole("button", { name: "Switch camera", exact: true }));
      await manager.getByRole("button", { name: "Switch camera", exact: true }).click();
      await manager.waitForFunction(() => window.__requestedCameraIds?.includes("synthetic-front"));
      await manager.waitForFunction(() => {
        const button = [...document.querySelectorAll("button")].find(
          (item) => item.textContent?.trim() === "Take picture",
        );
        return button && !button.disabled;
      });
      await manager.getByRole("button", { name: "Take picture", exact: true }).click();
      await visible(manager.getByAltText("Selected receipt for review before creating a draft"));
      await manager.getByRole("button", { name: "Remove image", exact: true }).click();
    } finally {
      await manager.evaluate(() => window.__restoreCameraSelection?.());
    }
  });
  await check("Camera disconnection restores focus and keeps upload available", async () => {
    await navigate(manager, "Scan receipt");
    await manager.getByRole("button", { name: "Take photo", exact: true }).click();
    await manager.waitForFunction(() => {
      const video = document.querySelector("video");
      return video?.srcObject?.getVideoTracks()?.[0]?.readyState === "live";
    });
    await manager.evaluate(() => {
      document
        .querySelector("video")
        .srcObject.getVideoTracks()[0]
        .dispatchEvent(new Event("ended"));
    });
    await visible(manager.getByRole("alert").filter({ hasText: "The camera disconnected" }));
    await manager.waitForFunction(
      () => document.activeElement?.textContent?.trim() === "Take photo",
    );
    assert.equal(await manager.getByRole("button", { name: "Upload file" }).isEnabled(), true);
  });
  await check("Mobile-UA native capture input accepts a synthetic photo", async () => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      isMobile: true,
      hasTouch: true,
    });
    try {
      await mobileContext.route("**/*", (route) =>
        new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
      );
      const mobilePage = await mobileContext.newPage();
      observeConsole(mobilePage);
      mobilePage.on("pageerror", (error) => runtimeErrors.push(redact(error.message)));
      await login(mobilePage, "manager");
      await navigate(mobilePage, "Scan receipt");
      const input = mobilePage.getByLabel("Take a receipt photo");
      assert.equal(await input.getAttribute("capture"), "environment");
      assert.equal(await input.getAttribute("accept"), "image/*");
      const chooserPromise = mobilePage.waitForEvent("filechooser");
      await mobilePage.getByRole("button", { name: "Take photo", exact: true }).click();
      const chooser = await chooserPromise;
      await chooser.setFiles(payload);
      await visible(mobilePage.getByAltText("Selected receipt for review before creating a draft"));
      await noOverflow(mobilePage);
      await mobilePage.screenshot({
        path: join(artifacts, `${browserChannel}-mobile-capture-375px.png`),
      });
    } finally {
      await mobileContext.close();
    }
  });
  await check(
    "Oversized synthetic JPEG is resized before upload without losing the selected file",
    async () => {
      await navigate(manager, "Scan receipt");
      await manager.setViewportSize({ width: 375, height: 812 });
      const oversizedBase64 = await manager.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 4000;
        canvas.height = 3000;
        const context = canvas.getContext("2d");
        const pixels = context.createImageData(canvas.width, canvas.height);
        let seed = 17;
        for (let index = 0; index < pixels.data.length; index += 4) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          pixels.data[index] = seed & 255;
          pixels.data[index + 1] = (seed >>> 8) & 255;
          pixels.data[index + 2] = (seed >>> 16) & 255;
          pixels.data[index + 3] = 255;
        }
        context.putImageData(pixels, 0, 0);
        const encoded = canvas.toDataURL("image/jpeg", 0.99).split(",")[1];
        canvas.width = canvas.height = 0;
        return encoded;
      });
      const oversized = Buffer.from(oversizedBase64, "base64");
      assert.ok(oversized.length > 6 * 1024 * 1024);
      assert.ok(oversized.length < 40 * 1024 * 1024);
      await manager.getByLabel("Upload a receipt image").setInputFiles({
        name: "oversized-synthetic.jpg",
        mimeType: "image/jpeg",
        buffer: oversized,
      });
      const previewImage = manager.getByAltText(
        "Selected receipt for review before creating a draft",
      );
      await visible(previewImage);
      const processed = await previewImage.evaluate(async (image) => {
        const blob = await (await fetch(image.src)).blob();
        const bitmap = await createImageBitmap(blob);
        const result = {
          mimeType: blob.type,
          bytes: blob.size,
          width: bitmap.width,
          height: bitmap.height,
        };
        bitmap.close();
        return result;
      });
      assert.equal(processed.mimeType, "image/jpeg");
      assert.ok(processed.bytes > 0 && processed.bytes <= 6 * 1024 * 1024);
      assert.ok(processed.width <= 3200 && processed.width * processed.height <= 8_000_000);
      await noOverflow(manager);
      await navigate(manager, "Inventory");
      await navigate(manager, "Scan receipt");
      await visible(manager.getByAltText("Selected receipt for review before creating a draft"));
      await manager.getByRole("button", { name: "Remove image", exact: true }).click();
      await previewImage.waitFor({ state: "hidden" });
      await manager.setViewportSize({ width: 1280, height: 900 });
    },
  );
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
      assert.equal(firstDraft.documentDate, null);
      assert.equal(firstDraft.extractedDocumentDate, "2026-10-02");
      assert.equal(firstDraft.dateNeedsReview, true);
      await visible(
        manager
          .getByRole("alert")
          .filter({ hasText: /Photo is partly unclear|Every line needs checking/ }),
      );
      await manager.screenshot({ path: join(artifacts, "draft-desktop.png"), fullPage: true });
      await visible(
        manager.getByText("Check the issue date against the document, then confirm it below.", {
          exact: true,
        }),
      );
      assert.equal(await manager.getByLabel("Document date for this intake").inputValue(), "");
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
      await manager.evaluate(() => window.scrollTo(0, 0));
      await manager.waitForTimeout(550);
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
      await visible(staff.getByText("Synthetic Lamp", { exact: true }));
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
    "Staff actual quantities do not mutate stock before confirmation; final check posts actual 1/27",
    async () => {
      const before = await snapshot();
      await staff.getByText("Synthetic Widget Renamed", { exact: true }).click();
      await staff
        .getByLabel("How much did you receive for Synthetic Widget Renamed?", { exact: true })
        .fill("-1");
      await visible(
        staff.getByText("Enter a whole number of 0 or more.", {
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
        .getByLabel("How much did you receive for Synthetic Widget Renamed?", { exact: true })
        .fill("1");
      await staff.getByText("Synthetic Lamp", { exact: true }).click();
      await staff
        .getByLabel("How much did you receive for Synthetic Lamp?", { exact: true })
        .fill("27");
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
  await check(
    "Matching actual quantity confirmation and same-date receipt History grouping",
    async () => {
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
      assert.equal(
        await staff
          .getByLabel("How much did you receive for Synthetic Widget Renamed?", { exact: true })
          .inputValue(),
        "1",
      );
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
    },
  );
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
  await check("Slow scan keeps status across sections and finishes without redirect", async () => {
    const before = await snapshot();
    let delayPost = true;
    await manager.route("**/api/estock/drafts", async (route) => {
      if (route.request().method() === "POST" && delayPost) {
        delayPost = false;
        await delay(11_250);
      }
      await route.continue();
    });
    await navigate(manager, "Scan receipt");
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByText("Gemini is reading the image. Stock will stay unchanged."));
    await navigate(manager, "History");
    await visible(manager.getByText(/Still reading your document/));
    await visible(manager.getByText("Draft created. Open Drafts to review it.", { exact: true }));
    await visible(manager.getByRole("heading", { name: "History", exact: true }));
    assert.deepEqual(await snapshot(), before);
    await navigate(manager, "Scan receipt");
    assert.equal(
      await manager.getByAltText("Selected receipt for review before creating a draft").count(),
      0,
    );
    await navigate(manager, "Drafts");
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    await manager.getByRole("button", { name: "Discard draft", exact: true }).click();
    await manager.getByRole("button", { name: "Yes, discard draft", exact: true }).click();
    await manager.unroute("**/api/estock/drafts");
    assert.deepEqual(await snapshot(), before);
  });
  await check("Scan failure after navigation retains the photo for retry", async () => {
    const before = await snapshot();
    await manager.route("**/api/estock/drafts", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await delay(500);
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Synthetic delayed scan outage" }),
      });
    });
    await navigate(manager, "Scan receipt");
    await manager.getByLabel("Upload a receipt image").setInputFiles(payload);
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await navigate(manager, "History");
    await visible(manager.getByText(/Scan needs attention/));
    await visible(manager.getByRole("heading", { name: "History", exact: true }));
    await manager.unroute("**/api/estock/drafts");
    await navigate(manager, "Scan receipt");
    await visible(manager.getByAltText("Selected receipt for review before creating a draft"));
    await visible(manager.getByRole("alert").filter({ hasText: "Synthetic delayed scan outage" }));
    await manager.getByRole("button", { name: "Create draft", exact: true }).click();
    await visible(manager.getByRole("heading", { name: "Document lines", exact: true }));
    await manager.getByRole("button", { name: "Discard draft", exact: true }).click();
    await manager.getByRole("button", { name: "Yes, discard draft", exact: true }).click();
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
      assert.equal(
        await manager.getByRole("button", { name: "Send to Staff", exact: true }).isDisabled(),
        true,
      );
      await manager.getByLabel("Document date for this intake").fill("2026-10-03");
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
      await visible(staff.getByText("Synthetic Widget Renamed", { exact: true }));
      await staff.getByText("Synthetic Widget Renamed", { exact: true }).click();
      await staff
        .getByLabel("How much did you receive for Synthetic Widget Renamed?", { exact: true })
        .fill("0");
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
      await manager.getByRole("button", { name: "Manage products", exact: true }).click();
      const lamp = managedRow(manager, "Synthetic Lamp");
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
      await navigate(manager, "Inventory");
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
      await manager.getByLabel("Document date for this intake").fill("2026-10-03");
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
      await visible(staff.getByText("Synthetic pending lamp", { exact: true }));
      await staff.getByText("Synthetic pending lamp", { exact: true }).click();
      await staff
        .getByLabel("How much did you receive for Synthetic pending lamp?", { exact: true })
        .fill("1");
      await navigate(manager, "Inventory");
      await manager.getByRole("button", { name: "Manage products", exact: true }).click();
      await managedRow(manager, "Synthetic pending lamp")
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
      await visible(staff.getByText("Synthetic pending lamp", { exact: true }));
      assert.match(await staff.locator("main").innerText(), /Expected: 2 pcs/);
      await staff.getByRole("button", { name: "Reopen latest check", exact: true }).click();
      await visible(staff.getByText("Synthetic Widget Renamed", { exact: true }));
      assert.match(await staff.locator("main").innerText(), /Expected: 4 pcs/);
      assert.equal(
        await staff
          .getByLabel("How much did you receive for Synthetic Widget Renamed?", { exact: true })
          .inputValue(),
        "4",
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
    `BROWSER SUMMARY: ${results.length} journeys passed in headless ${browserChannel}. Fake webcam and mobile-UA capture input tested; physical camera/mobile device/live Gemini not tested.`,
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
        browserChannel,
        simulatedCamera: "Chromium fake media stream",
        mobileCaptureInput: "Android user-agent and synthetic file chooser",
        physicalCamera: "Unverified",
        realMobileDevice: "Unverified",
        liveGemini: "Unverified",
      },
      null,
      2,
    ),
  );
}
