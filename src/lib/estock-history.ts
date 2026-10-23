export interface HistoryMovement {
  id: string;
  type: "OPENING" | "INTAKE" | "TAKE" | "RETURN";
  quantity: number;
  delta: number;
  productId: string;
  productName: string;
  unit: string;
  actorRole: "manager" | "staff";
  actorAccountId: "manager" | "staff";
  createdAt: string;
  documentDate: string | null;
  approvedAt: string | null;
  draftId: string | null;
  lineOrder: number | null;
  rawName: string | null;
  reviewedName: string | null;
  rawQuantity: number | null;
  rawUnit: string | null;
}

export interface ReceiptHistoryEntry {
  draftId: string;
  documentDate: string | null;
  approvedAt: string;
  managerAccountId: string;
  lines: HistoryMovement[];
}

export function receiptHistory(movements: HistoryMovement[]): ReceiptHistoryEntry[] {
  const receipts = new Map<string, ReceiptHistoryEntry>();
  for (const movement of movements) {
    if (movement.type !== "INTAKE" || !movement.draftId) continue;
    let receipt = receipts.get(movement.draftId);
    if (!receipt) {
      receipt = {
        draftId: movement.draftId,
        documentDate: movement.documentDate,
        approvedAt: movement.approvedAt || movement.createdAt,
        managerAccountId: movement.actorAccountId,
        lines: [],
      };
      receipts.set(movement.draftId, receipt);
    }
    receipt.lines.push(movement);
  }
  return [...receipts.values()]
    .map((receipt) => ({
      ...receipt,
      lines: receipt.lines.sort((a, b) => (a.lineOrder ?? 0) - (b.lineOrder ?? 0)),
    }))
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt) || a.draftId.localeCompare(b.draftId));
}

export function matchesHistorySearch(movement: HistoryMovement, query: string): boolean {
  const text = [
    movement.productName,
    movement.rawName,
    movement.reviewedName,
    movement.unit,
    movement.quantity,
    movement.documentDate,
    movement.type,
    movement.actorRole === "staff" ? "Shared Staff" : "Manager",
  ].join(" ");
  return text.toLocaleLowerCase("en").includes(query.trim().toLocaleLowerCase("en"));
}
