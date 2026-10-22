import { getDb, ORG, transaction } from "../src/lib/server/db.ts";
import { seedDatabase } from "../src/lib/server/seed.ts";
import { addDays } from "../src/lib/server/validation.ts";
import { act, nextDemoDay } from "../src/lib/server/service.ts";
import { state } from "../src/lib/server/store.ts";
import { closeDb } from "../src/lib/server/db.ts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function isolatedSyntheticFixture(mode = "MOCK") {
  const names = ["ESTOCK_DB_PATH", "FORECAST_MODE", "RUNPOD_ENDPOINT_ID", "RUNPOD_API_KEY", "CHRONOS_MODEL_REVISION", "FORECAST_ALLOW_FALLBACK"];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const fetchBefore = globalThis.fetch;
  closeDb();
  const directory = mkdtempSync(join(tmpdir(), "estock-test-"));
  for (const name of names) delete process.env[name];
  process.env.ESTOCK_DB_PATH = join(directory, "records.sqlite");
  process.env.FORECAST_MODE = mode;
  globalThis.fetch = async () => { throw new Error("External network is disabled in synthetic tests."); };
  syntheticFixture();
  return () => {
    closeDb();
    globalThis.fetch = fetchBefore;
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    rmSync(directory, { recursive: true, force: true });
  };
}

export async function advanceFixtureTo(target: string) {
  while (state("manager").demoDate < target) {
    const app = state("manager");
    if (app.closedThrough < app.demoDate)
      await act("manager", "closeDay", { date: app.demoDate, confirmComplete: true }, `fixture-close:${app.demoDate}`);
    nextDemoDay("manager", { date: app.demoDate, demoGeneration: app.demoGeneration });
  }
}

// Explicit test data only. Normal application startup never imports this module.
export function syntheticFixture() {
  seedDatabase();
  const db = getDb();
  if (db.prepare("SELECT id FROM products LIMIT 1").get())
    throw new Error("Synthetic fixture requires an empty, isolated test database.");
  transaction(() => {
    const fixtures = [
      { id: "product-cartons", sku: "SYN-001", name: "Takeaway cartons", unit: "units", precision: 0, opening: 55, sale: 10, daily: 10, safety: 20, pack: 12, minimum: 12, price: 120, days: 168 },
      { id: "product-coffee", sku: "SYN-002", name: "Coffee beans", unit: "kg", precision: 3, opening: 23.5, sale: 1.5, daily: 1.5, safety: 3, pack: 2.5, minimum: 5, price: 3200, days: 168 },
      { id: "product-lids", sku: "SYN-003", name: "Cup lids", unit: "units", precision: 0, opening: 80, sale: 5, daily: 5, safety: 20, pack: 20, minimum: 20, price: 25, days: 10 },
    ];
    for (const item of fixtures) {
      db.prepare("INSERT INTO products VALUES(?,?,?,?,?,?,?,2,0)").run(item.id, ORG, item.sku, item.name, item.unit, item.precision, "2026-10-20");
      const policy = { supplierId: "supplier-demo", leadTimeDays: 3, reviewIntervalDays: 7, safetyStock: item.safety, packSize: item.pack, minimumOrder: item.minimum, unitPriceSen: item.price, shippingSen: 0, maxOrderSen: 200000, nextReviewDate: "2026-10-21", version: 1 };
      db.prepare("INSERT INTO policies VALUES(?,?,?,?,?)").run(item.id, ORG, policy.supplierId, 1, JSON.stringify(policy));
      for (let i = 0; i < item.days; i++) {
        const day = addDays("2026-10-19", i - item.days + 1);
        const multiplier = item.id === "product-coffee" ? [0.9, 1, 1, 1, 1.1, 1.2, 0.8][i % 7] : 1;
        db.prepare("INSERT INTO daily_sales VALUES(?,?,?,?,?,?,?,?,1)").run(ORG, item.id, day, Math.round(item.daily * multiplier * 1000), 1, 0, `fixture:${item.id}:${day}`, "synthetic-history");
      }
      for (const movement of [{ type: "OPENING_BALANCE", amount: item.opening, delta: item.opening }, { type: "SALE", amount: item.sale, delta: -item.sale }]) {
        const id = `fixture:${item.id}:${movement.type}`;
        db.prepare("INSERT INTO stock_movements VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(id, ORG, item.id, id, movement.type, Math.round(movement.amount * 1000), Math.round(movement.delta * 1000), "2026-10-20", "Synthetic test fixture", "", "system", "2026-10-20T09:00:00.000Z");
      }
      db.prepare("INSERT INTO daily_sales VALUES(?,?,?,?,?,?,?,?,1)").run(ORG, item.id, "2026-10-20", Math.round(item.sale * 1000), 1, 0, `ledger:${item.id}:2026-10-20`, "ledger");
    }
  });
}
