export type Role = "manager" | "staff";
export type MovementType =
  | "OPENING_BALANCE"
  | "SALE"
  | "INTERNAL_USE"
  | "DAMAGE_OR_LOSS"
  | "CUSTOMER_RETURN_USABLE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "SUPPLIER_RECEIPT";
export type RecommendationStatus =
  | "PENDING_APPROVAL"
  | "URGENT_REVIEW"
  | "NO_ORDER_NEEDED"
  | "MONITORING"
  | "NEEDS_DATA"
  | "NEEDS_REVIEW"
  | "WAITING_EXISTING_ORDER"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";
export type OrderStatus =
  | "APPROVED_PENDING_DISPATCH"
  | "SENT_SIMULATED"
  | "SUPPLIER_CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED"
  | "NEEDS_REVIEW"
  | "DISPATCH_FAILED"
  | "DISPATCH_UNKNOWN";
export type ForecastSource =
  | "MOCK_BASELINE"
  | "BASELINE_FALLBACK"
  | "BASELINE_SELECTED"
  | "RUNPOD"
  | "CACHE";

export interface Supplier {
  id: string;
  name: string;
  channel: "SIMULATED";
}
export interface Policy {
  supplierId: string;
  leadTimeDays: number;
  reviewIntervalDays: number;
  safetyStock: number;
  packSize: number;
  minimumOrder: number;
  unitPriceSen: number | null;
  shippingSen: number | null;
  maxOrderSen: number;
  nextReviewDate: string;
  version: number;
}
export interface SalesDay {
  date: string;
  quantity: number;
  complete: boolean;
  stockout: boolean;
  source: string;
}
export interface SalesWeek {
  startDate: string;
  endDate: string;
  quantity: number;
  completeDays: number;
  complete: boolean;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  precision: number;
  stock: number;
  confirmedIncoming: number;
  ledgerVersion: number;
  inboundVersion: number;
  ledgerStartDate: string;
  policy: Policy;
  history: SalesDay[];
  weeks: SalesWeek[];
  recommendation: Recommendation | null;
}
export interface ProjectionDay {
  date: string;
  demand: number;
  inbound: number;
  closingStock: number;
  withOrder: number;
}
export interface PurchaseCalculation {
  usableStock: number;
  safetyStock: number;
  packSize: number;
  minimumOrder: number;
  horizonDays: number;
  effectiveReviewDays: number;
  dailyDemand: number;
  weeklyDemand: number;
  coverageDays: number | null;
  safetyDate: string | null;
  stockoutDate: string | null;
  orderDate: string | null;
  arrivalDate: string;
  demand: number;
  eligibleInbound: number;
  rawQuantity: number;
  suggestedQuantity: number;
  packs: number;
  estimatedCostSen: number | null;
  status: RecommendationStatus;
  reason: string;
  warnings: string[];
  projections: ProjectionDay[];
}
export interface ForecastRequest {
  requestId: string;
  productId: string;
  cutoffDate: string;
  horizonDays: number;
  inputHash: string;
  dates: string[];
  values: number[];
  stockoutFlags: boolean[];
}
export interface ForecastResult {
  requestId?: string;
  productId?: string;
  evaluation?: Record<string, unknown>;
  device?: string;
  modelP50?: number[];
  status: "PENDING" | "COMPLETED" | "FAILED";
  jobId?: string;
  source: ForecastSource;
  modelId: string;
  modelRevision: string;
  inputHash: string;
  cutoffDate: string;
  generatedAt: string;
  runtimeMs: number;
  dates: string[];
  p50: number[];
  warnings: string[];
  error?: string;
}
export interface Analysis {
  id: string;
  productId: string;
  cutoffDate: string;
  decisionDate: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "NEEDS_DATA";
  source: ForecastSource | null;
  modelId: string | null;
  modelRevision: string | null;
  generatedAt: string;
  inputHash: string;
  jobId: string | null;
  error: string | null;
  forecast: ForecastResult | null;
}
export interface Recommendation {
  decisionReason?: string;
  id: string;
  productId: string;
  revision: number;
  status: RecommendationStatus;
  cutoffDate: string;
  decisionDate: string;
  expiresAt: string;
  createdAt: string;
  ledgerVersion: number;
  inboundVersion: number;
  policyVersion: number;
  analysisId: string;
  source: ForecastSource | null;
  calculation: PurchaseCalculation | null;
  reason: string;
  warnings: string[];
}
export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  reference: string;
  reason: string;
  actor: Role | "system";
}
export interface PurchaseOrder {
  id: string;
  reference: string;
  productId: string;
  supplierId: string;
  quantity: number;
  remaining: number;
  unit: string;
  status: OrderStatus;
  expectedDate: string;
  confirmedDate: string | null;
  estimatedCostSen: number;
  createdAt: string;
  recommendationId: string;
  damageOpen: boolean;
}
export interface OutboxMessage {
  id: string;
  orderId: string;
  channel: "SIMULATED";
  status: string;
  message: string;
  attempts: number;
  createdAt: string;
}
export interface Receipt {
  id: string;
  orderId: string;
  productId: string;
  usable: number;
  damaged: number;
  date: string;
  reference: string;
}
export interface ActivityEvent {
  id: string;
  actor: Role | "system";
  action: string;
  entityId: string;
  at: string;
  detail: string;
  before: unknown;
  after: unknown;
}
export interface AppState {
  role: Role;
  organisation: { id: string; name: string };
  demoDate: string;
  closedThrough: string;
  suppliers: Supplier[];
  products: Product[];
  movements: Movement[];
  analyses: Analysis[];
  orders: PurchaseOrder[];
  outbox: OutboxMessage[];
  receipts: Receipt[];
  activity: ActivityEvent[];
  forecastMode: "MOCK" | "RUNPOD";
}
export interface ImportPreview {
  corrections?: number;
  type: "history" | "opening";
  rows: number;
  valid: boolean;
  errors: { row: number; message: string }[];
  duplicates: number;
}
export type ActionName =
  | "createProduct"
  | "updatePolicy"
  | "recordMovement"
  | "closeDay"
  | "analyse"
  | "pollAnalysis"
  | "approve"
  | "reject"
  | "dispatch"
  | "confirmOrder"
  | "receive"
  | "cancelOrder"
  | "resolveDamage"
  | "previewImport"
  | "commitImport";
export interface ActionResult {
  message: string;
  state: AppState;
  preview?: ImportPreview;
  entityId?: string;
}
