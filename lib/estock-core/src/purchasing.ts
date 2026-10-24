import type { Policy, PurchaseCalculation } from "./contracts.ts";
import { addDays, date, fail, integer, number, quantity } from "./server/validation.ts";

export interface PurchasingInput {
  unit?: string;
  stock: number;
  decisionDate: string;
  demandStartDate?: string;
  daily: number[];
  policy: Policy;
  inbound: { quantity: number; date: string; confirmed: boolean }[];
  hasCommitment?: boolean;
}

export const roundQuantity = (value: number) => Math.round(value * 1000) / 1000;

export function calculatePurchase(input: PurchasingInput): PurchaseCalculation {
  const { stock, decisionDate, daily, policy: p, inbound } = input;
  number(stock, "Stock");
  date(decisionDate);
  const demandStartDate = input.demandStartDate || decisionDate;
  date(demandStartDate);
  integer(p.leadTimeDays, "Lead time", 1, 14);
  integer(p.reviewIntervalDays, "Review interval", 1, 30);
  number(p.safetyStock, "Safety stock");
  number(p.packSize, "Pack size", 0.001);
  number(p.minimumOrder, "Minimum order");
  quantity(stock, 3, "Stock", true);
  quantity(p.safetyStock, 3, "Safety stock", true);
  quantity(p.packSize, 3, "Pack size");
  quantity(p.minimumOrder, 3, "Minimum order", true);
  date(p.nextReviewDate, "Next review date");
  if (p.unitPriceSen !== null) integer(p.unitPriceSen, "Reference unit price", 0, 100000000);
  if (p.shippingSen !== null) integer(p.shippingSen, "Shipping", 0, 100000000);
  integer(p.maxOrderSen, "Approval limit", 1, 1000000000);
  const untilReview = Math.round(
    (Date.parse(p.nextReviewDate) - Date.parse(decisionDate)) / 86400000,
  );
  const due = untilReview <= 0;
  const effectiveReviewDays = due ? p.reviewIntervalDays : untilReview;
  const horizonDays = p.leadTimeDays + effectiveReviewDays;
  if (daily.length < Math.max(30, horizonDays))
    fail("The demand estimate does not cover the protection period.");
  daily.forEach((value) => {
    number(value, "Daily demand");
  });
  for (const item of inbound) {
    number(item.quantity, "Inbound quantity");
    date(item.date);
  }
  const horizonEnd = addDays(demandStartDate, horizonDays - 1);
  const eligibleInbound = roundQuantity(
    inbound
      .filter((item) => item.confirmed && item.date >= decisionDate && item.date <= horizonEnd)
      .reduce((sum, item) => sum + item.quantity, 0),
  );
  const demand = roundQuantity(daily.slice(0, horizonDays).reduce((a, b) => a + b, 0));
  const rawQuantity = roundQuantity(Math.max(0, demand + p.safetyStock - stock - eligibleInbound));
  const packMilli = Math.round(p.packSize * 1000);
  const rounded =
    rawQuantity > 0
      ? (Math.ceil(
          Math.max(Math.round(rawQuantity * 1000), Math.round(p.minimumOrder * 1000)) / packMilli,
        ) *
          packMilli) /
        1000
      : 0;
  const arrivalDate = addDays(decisionDate, p.leadTimeDays);
  let balance = stock;
  let safetyDate: string | null = stock <= p.safetyStock ? decisionDate : null;
  let stockoutDate: string | null = null;
  const warnings: string[] = [];
  const projections = daily.map((value, index) => {
    const day = addDays(demandStartDate, index);
    const arriving = inbound
      .filter(
        (item) =>
          item.confirmed &&
          (item.date === day ||
            (index === 0 && item.date >= decisionDate && item.date < demandStartDate)),
      )
      .reduce((sum, item) => sum + item.quantity, 0);
    balance = roundQuantity(balance + arriving - value);
    if (balance <= p.safetyStock && !safetyDate) safetyDate = day;
    if (balance < 0 && !stockoutDate) stockoutDate = day;
    return {
      date: day,
      demand: value,
      inbound: roundQuantity(arriving),
      closingStock: balance,
      withOrder: roundQuantity(balance + (day >= arrivalDate ? rounded : 0)),
    };
  });
  const earlyRisk = projections
    .filter((day) => day.date < arrivalDate)
    .some((day) => day.closingStock < p.safetyStock);
  const urgent = projections.slice(0, horizonDays).some((day) => day.withOrder < 0);
  let status: PurchaseCalculation["status"] =
    !due && !earlyRisk
      ? "MONITORING"
      : rawQuantity === 0
        ? "NO_ORDER_NEEDED"
        : urgent
          ? "URGENT_REVIEW"
          : "PENDING_APPROVAL";
  let reason =
    status === "MONITORING"
      ? `Routine review is due ${p.nextReviewDate}; no shortage is projected before the next delivery could arrive.`
      : status === "NO_ORDER_NEEDED"
        ? "Stock and confirmed incoming goods cover the protection period and safety stock."
        : `Demand over ${horizonDays} days plus safety stock exceeds stock and eligible incoming goods by ${rawQuantity} ${input.unit || "units"}.`;
  if (urgent)
    warnings.push(
      "A shortage remains before or after the proposed delivery. Clarify timing or expedite manually; this order alone does not resolve it.",
    );
  if (inbound.some((item) => item.confirmed && item.date < decisionDate))
    warnings.push(
      "A confirmed delivery is overdue. It is excluded until the supplier provides a new date.",
    );
  if (input.hasCommitment) {
    status = "WAITING_EXISTING_ORDER";
    reason =
      "An unresolved purchase already exists. Confirm, receive or explicitly cancel it before another order.";
  } else if (inbound.some((item) => item.confirmed && item.date < decisionDate))
    status = "NEEDS_REVIEW";
  const suggestedQuantity = ["MONITORING", "WAITING_EXISTING_ORDER", "NEEDS_REVIEW"].includes(
    status,
  )
    ? 0
    : rounded;
  const estimatedCostSen =
    p.unitPriceSen === null || p.shippingSen === null
      ? null
      : Math.round(suggestedQuantity * p.unitPriceSen) +
        (suggestedQuantity > 0 ? p.shippingSen : 0);
  if (estimatedCostSen === null)
    warnings.push("Reference price or shipping cost is unknown. Complete costs before approval.");
  if (estimatedCostSen !== null && estimatedCostSen > p.maxOrderSen)
    warnings.push(
      "The estimate exceeds the configured approval limit. Review policy before approval.",
    );
  const dailyDemand = daily.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const orderDate =
    status === "MONITORING" ? p.nextReviewDate : suggestedQuantity > 0 ? decisionDate : null;
  return {
    usableStock: stock,
    safetyStock: p.safetyStock,
    packSize: p.packSize,
    minimumOrder: p.minimumOrder,
    horizonDays,
    effectiveReviewDays,
    dailyDemand: roundQuantity(dailyDemand),
    weeklyDemand: roundQuantity(dailyDemand * 7),
    coverageDays: dailyDemand > 0 ? Math.round((stock / dailyDemand) * 10) / 10 : null,
    safetyDate,
    stockoutDate,
    orderDate,
    arrivalDate,
    demand,
    eligibleInbound,
    rawQuantity,
    suggestedQuantity,
    packs: suggestedQuantity / p.packSize,
    estimatedCostSen,
    status,
    reason,
    warnings,
    projections: projections.map((day) => ({
      ...day,
      withOrder: roundQuantity(
        day.closingStock + (day.date >= arrivalDate ? suggestedQuantity : 0),
      ),
    })),
  };
}

export function manualEstimate(input: {
  stock: number;
  weeklySales: number;
  leadTimeDays: number;
  reviewIntervalDays: number;
  safetyStock: number;
  packSize: number;
  minimumOrder: number;
  unitPriceSen: number | null;
  date: string;
}) {
  number(input.weeklySales, "Expected weekly sales");
  return calculatePurchase({
    stock: input.stock,
    decisionDate: input.date,
    daily: Array(366).fill(input.weeklySales / 7),
    inbound: [],
    policy: {
      supplierId: "manual",
      ...input,
      shippingSen: null,
      maxOrderSen: 1000000000,
      nextReviewDate: input.date,
      version: 1,
    },
  });
}
