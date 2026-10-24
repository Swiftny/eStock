import type { CoverageInput, StockCoverage } from "../../forecasting/contracts.ts";
import { addDays, date, fail, number } from "../validation.ts";

const round = (value: number) => Math.round(value * 1000) / 1000;

export function calculateStockCoverage(input: CoverageInput): StockCoverage {
  number(input.stock, "Stock");
  number(input.safetyStock, "Safety stock");
  date(input.decisionDate, "Decision date");
  if (!input.daily.length || input.daily.length > 366)
    fail("Coverage requires 1 to 366 forecast days.");
  for (const value of input.daily) number(value, "Daily demand");
  for (const item of input.inbound) {
    number(item.quantity, "Incoming quantity");
    date(item.date, "Incoming date");
    if (typeof item.confirmed !== "boolean") fail("Incoming confirmation must be true or false.");
  }
  const warnings: string[] = [];
  if (input.inbound.some((item) => item.confirmed && item.date < input.decisionDate))
    warnings.push("Overdue incoming goods are excluded until a new arrival date is confirmed.");
  if (input.inbound.some((item) => !item.confirmed))
    warnings.push("Unconfirmed incoming goods are excluded from stock coverage.");

  let balance = input.stock;
  let daysRemaining: number | null = null;
  let depletionDate: string | null = null;
  let stockoutDate: string | null = null;
  let safetyDate: string | null = input.stock <= input.safetyStock ? input.decisionDate : null;
  let confirmedIncoming = 0;
  const projections = input.daily.map((demand, index) => {
    const day = addDays(input.decisionDate, index);
    const incoming = round(
      input.inbound
        .filter((item) => item.confirmed && item.date === day)
        .reduce((sum, item) => sum + item.quantity, 0),
    );
    const available = round(balance + incoming);
    balance = round(available - demand);
    confirmedIncoming = round(confirmedIncoming + incoming);
    if (!depletionDate && demand > 0 && balance <= 0) {
      depletionDate = day;
      daysRemaining = round(index + Math.max(0, Math.min(1, available / demand)));
    }
    if (!stockoutDate && balance < 0) stockoutDate = day;
    if (!safetyDate && balance <= input.safetyStock) safetyDate = day;
    return { date: day, demand, incoming, closingStock: balance };
  });
  const noDemand = input.daily.every((value) => value === 0);
  const status = noDemand
    ? "NO_DEMAND"
    : depletionDate
      ? "DEPLETES_WITHIN_HORIZON"
      : "COVERS_HORIZON";
  if (!noDemand && !depletionDate)
    warnings.push("Stock covers the forecast horizon. An exact depletion date is not estimated.");
  return {
    status,
    startingStock: input.stock,
    safetyStock: input.safetyStock,
    horizonDays: input.daily.length,
    daysRemaining,
    coveredDaysAtLeast: status === "COVERS_HORIZON" ? input.daily.length : null,
    depletionDate,
    stockoutDate,
    safetyDate,
    confirmedIncoming,
    warnings,
    projections,
  };
}
