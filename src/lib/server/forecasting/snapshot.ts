import type { Policy } from "../../contracts.ts";
import type { CoverageInput } from "../../forecasting/contracts.ts";
import { digest, openOrders, policy, stock } from "../store.ts";

export interface CoverageSnapshot extends Pick<CoverageInput, "stock" | "safetyStock" | "inbound"> {
  policyIdentity: string;
}

export function coveragePolicyIdentity(value: Policy) {
  return digest(value);
}

export function captureCoverageSnapshot(productId: string): CoverageSnapshot {
  const savedPolicy = policy(productId);
  return {
    stock: stock(productId),
    safetyStock: savedPolicy.safetyStock,
    policyIdentity: coveragePolicyIdentity(savedPolicy),
    inbound: openOrders(productId).map((order) => ({
      quantity: order.remaining,
      date: order.confirmedDate || order.expectedDate,
      confirmed: ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status),
    })),
  };
}
