import type { Role } from "../../contracts.ts";
import type { RecordStockMovementResponse } from "../../inventory/contracts.ts";
import { executeAction } from "../service.ts";
import { inventoryContext, inventoryMovement, inventoryProduct } from "./queries.ts";

export function recordStockMovement(
  role: Role,
  input: Record<string, unknown>,
  idempotencyKey: string,
): RecordStockMovementResponse {
  const result = executeAction(role, "recordMovement", input, idempotencyKey);
  if (!result.entityId) throw new Error("Stock movement result has no identifier.");
  const saved = inventoryMovement(result.entityId);
  return {
    ...inventoryContext(role),
    message: result.message,
    movement: saved,
    product: inventoryProduct(saved.productId),
  };
}
