export const reorderExample = {
  sku: "DEMO-CUP-01",
  product: "Paper cups",
  unit: "units",
  cutoff: "20 Oct 2026",
  demandPerDay: 10,
  leadTimeDays: 3,
  reviewDays: 7,
  buffer: 20,
  onHand: 45,
  confirmedInbound: 25,
  inboundDay: 3,
  packSize: 12,
  minimumOrder: 12,
} as const;

export const horizonDays = reorderExample.leadTimeDays + reorderExample.reviewDays;
export const exampleDemand = reorderExample.demandPerDay * horizonDays;
export const rawNeed = Math.max(
  0,
  exampleDemand + reorderExample.buffer - reorderExample.onHand - reorderExample.confirmedInbound,
);
export const recommendedQuantity =
  rawNeed > 0
    ? reorderExample.packSize *
      Math.ceil(Math.max(rawNeed, reorderExample.minimumOrder) / reorderExample.packSize)
    : 0;
