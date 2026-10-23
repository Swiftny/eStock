import assert from "node:assert/strict";
import { test } from "node:test";
import type { CoverageInput } from "../src/lib/forecasting/contracts.ts";
import { calculateStockCoverage } from "../src/lib/server/forecasting/coverage.ts";
import { DomainError } from "../src/lib/server/validation.ts";

const input: CoverageInput = {
  stock: 40,
  safetyStock: 10,
  decisionDate: "2026-10-21",
  daily: [10, 10, 10, 10, 10],
  inbound: [],
};

test("constant demand reaches zero after four days, with unmet demand on day five", () => {
  const result = calculateStockCoverage(input);
  assert.equal(result.daysRemaining, 4);
  assert.equal(result.depletionDate, "2026-10-24");
  assert.equal(result.stockoutDate, "2026-10-25");
  assert.equal(result.safetyDate, "2026-10-23");
  assert.equal(result.status, "DEPLETES_WITHIN_HORIZON");
  assert.deepEqual(
    result.projections.map((day) => day.closingStock),
    [30, 20, 10, 0, -10],
  );
});

test("coverage follows dated varying demand rather than dividing by average demand", () => {
  const result = calculateStockCoverage({ ...input, stock: 10, daily: [2, 2, 20, 2, 2] });
  assert.equal(result.daysRemaining, 2.3);
  assert.equal(result.depletionDate, "2026-10-23");
  assert.equal(result.stockoutDate, "2026-10-23");
  assert.notEqual(result.daysRemaining, 10 / (28 / 5));
});

test("confirmed incoming becomes usable at the start of its declared arrival day", () => {
  const result = calculateStockCoverage({
    ...input,
    stock: 10,
    daily: [5, 10, 5, 5],
    inbound: [{ quantity: 10, date: "2026-10-22", confirmed: true }],
  });
  assert.equal(result.confirmedIncoming, 10);
  assert.deepEqual(
    result.projections.map((day) => day.closingStock),
    [5, 5, 0, -5],
  );
  assert.equal(result.daysRemaining, 3);
});

test("a large later delivery cannot hide an earlier projected shortage", () => {
  const result = calculateStockCoverage({
    ...input,
    stock: 5,
    daily: [10, 10, 10],
    inbound: [{ quantity: 100, date: "2026-10-23", confirmed: true }],
  });
  assert.equal(result.daysRemaining, 0.5);
  assert.equal(result.stockoutDate, "2026-10-21");
  assert.deepEqual(
    result.projections.map((day) => day.closingStock),
    [-5, -15, 75],
  );
});

test("overdue, unconfirmed and out-of-horizon deliveries do not extend coverage", () => {
  const result = calculateStockCoverage({
    ...input,
    stock: 10,
    inbound: [
      { quantity: 200, date: "2026-10-20", confirmed: true },
      { quantity: 200, date: "2026-10-21", confirmed: false },
      { quantity: 200, date: "2026-10-26", confirmed: true },
    ],
  });
  assert.equal(result.daysRemaining, 1);
  assert.equal(result.confirmedIncoming, 0);
  assert.equal(result.warnings.length, 2);
});

test("sufficient stock provides a horizon lower bound without inventing a depletion date", () => {
  const result = calculateStockCoverage({ ...input, stock: 100 });
  assert.equal(result.status, "COVERS_HORIZON");
  assert.equal(result.daysRemaining, null);
  assert.equal(result.coveredDaysAtLeast, 5);
  assert.equal(result.depletionDate, null);
  assert.equal(result.stockoutDate, null);
  assert.match(result.warnings[0], /exact depletion date is not estimated/);
});

test("zero demand returns nullable coverage instead of infinity", () => {
  for (const stock of [0, 40]) {
    const result = calculateStockCoverage({ ...input, stock, daily: [0, 0, 0] });
    assert.equal(result.status, "NO_DEMAND");
    assert.equal(result.daysRemaining, null);
    assert.equal(result.coveredDaysAtLeast, null);
    assert.equal(result.depletionDate, null);
    assert.ok(!JSON.stringify(result).includes("Infinity"));
  }
});

test("fractional base quantities remain stable to three decimal places", () => {
  const result = calculateStockCoverage({
    ...input,
    stock: 0.3,
    safetyStock: 0.1,
    daily: [0.1, 0.1, 0.1, 0.1],
  });
  assert.equal(result.daysRemaining, 3);
  assert.deepEqual(
    result.projections.map((day) => day.closingStock),
    [0.2, 0.1, 0, -0.1],
  );
});

test("zero opening stock depletes immediately when the first day has demand", () => {
  const result = calculateStockCoverage({ ...input, stock: 0 });
  assert.equal(result.daysRemaining, 0);
  assert.equal(result.safetyDate, input.decisionDate);
  assert.equal(result.depletionDate, input.decisionDate);
});

test("an initially empty product can be covered by an arrival before first-day demand", () => {
  const result = calculateStockCoverage({
    ...input,
    stock: 0,
    daily: [1, 1],
    inbound: [{ quantity: 10, date: "2026-10-21", confirmed: true }],
  });
  assert.equal(result.status, "COVERS_HORIZON");
  assert.equal(result.stockoutDate, null);
});

test("coverage rejects nonfinite/negative quantities, invalid dates and empty horizons", () => {
  for (const changes of [
    { stock: -1 },
    { stock: Number.NaN },
    { safetyStock: Number.POSITIVE_INFINITY },
    { daily: [] },
    { daily: [-1] },
    { daily: [1_000_001] },
    { daily: Array(367).fill(1) },
    { decisionDate: "2026-02-30" },
    { inbound: [{ quantity: -1, date: "2026-10-21", confirmed: true }] },
    { inbound: [{ quantity: 1, date: "2026-02-30", confirmed: true }] },
  ]) {
    assert.throws(() => calculateStockCoverage({ ...input, ...changes }), DomainError);
  }
});

test("coverage does not mutate the frozen forecast or incoming inputs", () => {
  const saved = structuredClone(input);
  calculateStockCoverage(input);
  assert.deepEqual(input, saved);
});
