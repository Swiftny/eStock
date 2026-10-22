import { getDb, metadata, ORG, setMetadata, transaction } from "./db.ts";
import { addDays } from "./validation.ts";

export function seedDatabase() {
  const db = getDb();
  if (metadata("seed_version")) return;
  transaction(() => {
    if (metadata("seed_version")) return;
    setMetadata("seed_version", "estock-synthetic-v2-seed-20261021");
    setMetadata("demo_date", "2026-10-21");
    setMetadata("closed_through", "2026-10-20");
    db.prepare("INSERT INTO suppliers VALUES(?,?,?,?)").run(
      "supplier-demo",
      ORG,
      "Cedar Supply · synthetic",
      "SIMULATED",
    );
    const fixtures = [
      {
        id: "product-cartons",
        sku: "SYN-001",
        name: "Takeaway cartons",
        unit: "units",
        precision: 0,
        opening: 55,
        sale: 10,
        daily: 10,
        safety: 20,
        pack: 12,
        minimum: 12,
        price: 120,
        days: 168,
      },
      {
        id: "product-coffee",
        sku: "SYN-002",
        name: "Coffee beans",
        unit: "kg",
        precision: 3,
        opening: 23.5,
        sale: 1.5,
        daily: 1.5,
        safety: 3,
        pack: 2.5,
        minimum: 5,
        price: 3200,
        days: 168,
      },
      {
        id: "product-lids",
        sku: "SYN-003",
        name: "Cup lids",
        unit: "units",
        precision: 0,
        opening: 80,
        sale: 5,
        daily: 5,
        safety: 20,
        pack: 20,
        minimum: 20,
        price: 25,
        days: 10,
      },
    ];
    for (const item of fixtures) {
      db.prepare("INSERT INTO products VALUES(?,?,?,?,?,?,?,2,0)").run(
        item.id,
        ORG,
        item.sku,
        item.name,
        item.unit,
        item.precision,
        "2026-10-20",
      );
      const policy = {
        supplierId: "supplier-demo",
        leadTimeDays: 3,
        reviewIntervalDays: 7,
        safetyStock: item.safety,
        packSize: item.pack,
        minimumOrder: item.minimum,
        unitPriceSen: item.price,
        shippingSen: 0,
        maxOrderSen: 200000,
        nextReviewDate: "2026-10-21",
        version: 1,
      };
      db.prepare("INSERT INTO policies VALUES(?,?,?,?,?)").run(
        item.id,
        ORG,
        policy.supplierId,
        1,
        JSON.stringify(policy),
      );
      for (let i = 0; i < item.days; i++) {
        const businessDate = addDays("2026-10-19", i - item.days + 1);
        // A fixed pattern preserves mean demand and creates a declared weekly signal.
        const multiplier = item.id === "product-coffee" ? [0.9, 1, 1, 1, 1.1, 1.2, 0.8][i % 7] : 1;
        const amount = Math.round(item.daily * multiplier * 1000);
        db.prepare("INSERT INTO daily_sales VALUES(?,?,?,?,?,?,?,?,1)").run(
          ORG,
          item.id,
          businessDate,
          amount,
          1,
          0,
          `seed:${item.id}:${businessDate}`,
          "synthetic-history",
        );
      }
      for (const movement of [
        { type: "OPENING_BALANCE", amount: item.opening, delta: item.opening },
        { type: "SALE", amount: item.sale, delta: -item.sale },
      ]) {
        const id = `seed:${item.id}:${movement.type}`;
        db.prepare("INSERT INTO stock_movements VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(
          id,
          ORG,
          item.id,
          id,
          movement.type,
          Math.round(movement.amount * 1000),
          Math.round(movement.delta * 1000),
          "2026-10-20",
          "Synthetic seed",
          "",
          "system",
          "2026-10-20T09:00:00.000Z",
        );
      }
      db.prepare("INSERT INTO daily_sales VALUES(?,?,?,?,?,?,?,?,1)").run(
        ORG,
        item.id,
        "2026-10-20",
        Math.round(item.sale * 1000),
        1,
        0,
        `ledger:${item.id}:2026-10-20`,
        "ledger",
      );
    }
    const event = {
      id: "seed-created",
      actor: "system",
      action: "Demo seeded",
      entityId: ORG,
      at: "2026-10-20T09:00:00.000Z",
      detail: "Synthetic data loaded. Sales history is separate from physical opening stock.",
      before: null,
      after: { version: "estock-synthetic-v2-seed-20261021" },
    };
    db.prepare("INSERT INTO activity_events VALUES(?,?,?,?,?,?,?)").run(
      event.id,
      ORG,
      event.actor,
      event.action,
      event.entityId,
      event.at,
      JSON.stringify(event),
    );
  });
}
