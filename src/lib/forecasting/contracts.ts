import type { Analysis, Role } from "../contracts.ts";

export interface CoverageInput {
  stock: number;
  safetyStock: number;
  decisionDate: string;
  daily: number[];
  inbound: { quantity: number; date: string; confirmed: boolean }[];
}

export interface StockCoverage {
  status: "DEPLETES_WITHIN_HORIZON" | "COVERS_HORIZON" | "NO_DEMAND";
  startingStock: number;
  safetyStock: number;
  horizonDays: number;
  daysRemaining: number | null;
  coveredDaysAtLeast: number | null;
  depletionDate: string | null;
  stockoutDate: string | null;
  safetyDate: string | null;
  confirmedIncoming: number;
  warnings: string[];
  projections: { date: string; demand: number; incoming: number; closingStock: number }[];
}

export interface ForecastAnalysisView {
  analysis: Analysis;
  product: { id: string; sku: string; name: string; unit: string; precision: number };
  input: { cutoffDate: string; horizonDays: number; observations: number; inputHash: string };
  stale: boolean;
  staleReasons: string[];
  coverage: StockCoverage | null;
  coverageUnavailableReason: string | null;
}

export interface ForecastContext {
  synthetic: true;
  organisationId: string;
  role: Role;
  demoDate: string;
}

export interface ForecastAnalysisResponse extends ForecastContext {
  result: ForecastAnalysisView;
}

export interface ForecastAnalysesResponse extends ForecastContext {
  results: ForecastAnalysisView[];
}

export interface StartForecastInput {
  productId: string;
}
