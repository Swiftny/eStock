// Local verification only: separate source copy/schema, loopback provider stub, no external fetches.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, sep } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const require = createRequire(join(root, "package.json"));
const { Client } = require("pg");
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const connectionString = process.env.ESTOCK_TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set ESTOCK_TEST_DATABASE_URL or DATABASE_URL.");
const schema = `estock_preview_${randomBytes(8).toString("hex")}`;
assert.match(schema, /^estock_preview_[a-f0-9]{16}$/);
const control = new Client({ connectionString, connectionTimeoutMillis: 5000 });
const folder = mkdtempSync(join(tmpdir(), "estock-preview-"));
let created = false;
let child;
let stopping = false;
let restarting = false;
let applicationEnv;
let requests = 0;
const provider = createServer((request, response) => {
  request.resume();
  requests++;
  if (requests === 3 || requests === 4) {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        error: { code: 503, message: "Test-only provider outage", status: "UNAVAILABLE" },
      }),
    );
    return;
  }
  const extraction = {
    imageStatus: "partial",
    documentType: "nota",
    documentDate: "2026-10-02",
    dateNeedsReview: false,
    lines: [
      {
        rawName: "Synthetic Widget",
        rawQuantity: 2,
        rawUnit: "pcs",
        quantityText: "2 pcs",
        needsReview: false,
        reviewReason: null,
      },
      {
        rawName: "Unfamiliar Lamp",
        rawQuantity: 2,
        rawUnit: "boxes",
        quantityText: "2 boxes",
        needsReview: true,
        reviewReason: "kemasan_ambigu",
      },
      {
        rawName: null,
        rawQuantity: null,
        rawUnit: null,
        quantityText: null,
        needsReview: true,
        reviewReason: "nama_samar",
      },
    ],
  };
  response.writeHead(200, { "Content-Type": "application/json" });
  const body = JSON.stringify({
    candidates: [
      {
        content: { role: "model", parts: [{ text: JSON.stringify(extraction) }] },
        finishReason: "STOP",
      },
    ],
  });
  setTimeout(() => response.end(body), 500);
});

async function stopApplication() {
  if (child && child.exitCode === null) {
    const finished = new Promise((done) => child.once("exit", done));
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
      const code = await new Promise((done) => killer.once("exit", done));
      if (code !== 0)
        throw new Error(
          "Could not stop the owned test process tree. Run the test with permission to stop its own child processes.",
        );
    } else child.kill("SIGTERM");
    await finished;
  }
}

function startApplication() {
  child = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "dev",
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3107",
    ],
    {
      cwd: folder,
      env: applicationEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  child.stdout.on("data", (data) => process.stdout.write(data));
  child.stderr.on("data", (data) => process.stderr.write(data));
  child.once("exit", (code) => {
    if (!stopping && !restarting) {
      process.exitCode = code || 1;
      void cleanup();
    }
  });
}

async function cleanup() {
  if (stopping) return;
  stopping = true;
  await stopApplication();
  provider.closeAllConnections();
  await new Promise((done) => provider.close(done));
  if (created) {
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    assert.equal(
      (await control.query("SELECT 1 FROM pg_namespace WHERE nspname=$1", [schema])).rowCount,
      0,
    );
    console.log("CLEANUP PASS: owned preview schema removed.");
  }
  await control.end();
  const actual = realpathSync(folder);
  const expectedParent = realpathSync(dirname(folder));
  assert.ok(
    actual.startsWith(`${expectedParent}${sep}estock-preview-`) &&
      actual === join(expectedParent, basename(folder)),
  );
  rmSync(actual, { recursive: true });
  console.log(
    "CLEANUP PASS: owned temporary source copy removed. No operational records targeted.",
  );
  process.stdin.pause();
}

try {
  await control.connect();
  await control.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  const url = new URL(connectionString);
  url.searchParams.set("options", `-c search_path=${schema}`);
  const probe = new Client({ connectionString: url.href });
  try {
    await probe.connect();
    assert.equal((await probe.query("SELECT current_schema() AS name")).rows[0].name, schema);
  } finally {
    await probe.end();
  }
  for (const file of [
    "src",
    "public",
    "db",
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "next-env.d.ts",
  ]) {
    cpSync(join(root, file), join(folder, file), { recursive: true });
  }
  symlinkSync(join(root, "node_modules"), join(folder, "node_modules"), "junction");
  writeFileSync(join(folder, "public", "estock-test-preview-id.txt"), schema);
  const guard = join(folder, "test-network-guard.cjs");
  writeFileSync(
    guard,
    `const original=globalThis.fetch;globalThis.fetch=(input,...rest)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Test preview blocks external network');return original(input,...rest);};`,
  );
  await new Promise((done) => provider.listen(0, "127.0.0.1", done));
  const providerPort = provider.address().port;
  applicationEnv = {
    ...process.env,
    DATABASE_URL: url.href,
    NODE_ENV: "development",
    ESTOCK_DEMO_ALLOW_SHARED_PASSWORD: "true",
    GEMINI_API_KEY: "test-only-local-provider-stub",
    ESTOCK_GEMINI_MODEL: "gemini-3.8-flash",
    GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${providerPort}`,
    NODE_OPTIONS: `--require "${guard.replaceAll("\\", "/")}"`,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  startApplication();
  console.log(
    `TEST ONLY: http://127.0.0.1:3107/demo | synthetic provider stub | isolated schema | external fetch blocked`,
  );
  console.log(`Temporary preview folder: ${folder}`);
  console.log(`Preview identity: ${schema}`);
  console.log("Type stop then Enter to close the owned preview and clean up its schema.");
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (data) => {
    if (data.trim() === "stop") void cleanup();
    if (data.trim() === "restart" && !stopping && !restarting) {
      restarting = true;
      await stopApplication();
      startApplication();
      restarting = false;
      console.log("RESTART STARTED: same owned schema and private environment.");
    }
  });
  process.on("SIGINT", () => void cleanup());
  process.on("SIGTERM", () => void cleanup());
} catch (error) {
  console.error("Isolated preview failed:", error.code || error.name);
  await cleanup();
  process.exitCode = 1;
}
