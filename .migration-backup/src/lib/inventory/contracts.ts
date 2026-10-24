import type { Movement, MovementType, Role } from "../contracts.ts";

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  precision: number;
  stock: number;
  confirmedIncoming: number;
  ledgerVersion: number;
  ledgerStartDate: string;
  lastMovementAt: string | null;
}

export interface InventoryMovement extends Movement {
  sourceEventId: string;
  unit: string;
  delta: number;
  createdAt: string;
}

export interface InventoryContext {
  synthetic: true;
  organisationId: string;
  role: Role;
  demoDate: string;
  closedThrough: string;
}

export interface InventoryProductsResponse extends InventoryContext {
  products: InventoryProduct[];
}

export interface InventoryMovementsResponse extends InventoryContext {
  movements: InventoryMovement[];
  nextCursor: string | null;
}

export interface InventoryMovementQuery {
  productId?: string;
  limit?: number;
  cursor?: string;
}

export interface RecordStockMovementInput {
  productId: string;
  sourceEventId: string;
  type: Exclude<MovementType, "OPENING_BALANCE" | "SUPPLIER_RECEIPT">;
  quantity: number;
  unit: string;
  date: string;
  reference: string;
  reason?: string;
}

export interface RecordStockMovementResponse extends InventoryContext {
  message: string;
  movement: InventoryMovement;
  product: InventoryProduct;
}

export interface InventoryErrorResponse {
  error: string;
  code: string;
}
