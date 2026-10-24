import type { Analysis, ForecastRequest, Role } from "../../contracts.ts";
import type {
  ForecastAnalysesResponse,
  ForecastAnalysisResponse,
  ForecastAnalysisView,
  ForecastContext,
} from "../../forecasting/contracts.ts";
import { getDb, metadata, ORG } from "../db.ts";
import { seedDatabase } from "../seed.ts";
import { policy, productRow } from "../store.ts";
import { fail, integer, text } from "../validation.ts";
import { calculateStockCoverage } from "./coverage.ts";
import { type CoverageSnapshot, coveragePolicyIdentity } from "./snapshot.ts";

interface SavedRequest extends ForecastRequest {
  snapshot: { ledger: number; inbound: number; policy: number; cutoff: string; decision: string };
  coverage?: CoverageSnapshot;
}

function context(role: Role): ForecastContext {
  return { synthetic: true, organisationId: ORG, role, demoDate: metadata("demo_date") };
}

function view(row: Record<string, unknown>): ForecastAnalysisView {
  const analysis = JSON.parse(String(row.payload)) as Analysis;
  const input = JSON.parse(String(row.request)) as SavedRequest;
  const product = productRow(analysis.productId);
  const reasons: string[] = [];
  if (input.snapshot.ledger !== Number(product.ledger_version))
    reasons.push("Stock or sales history changed after this analysis was requested.");
  if (input.snapshot.inbound !== Number(product.inbound_version))
    reasons.push("Incoming deliveries changed after this analysis was requested.");
  if (
    input.snapshot.cutoff !== metadata("closed_through") ||
    input.snapshot.decision !== metadata("demo_date")
  )
    reasons.push("The business date or closing cutoff changed.");
  if (
    input.coverage &&
    input.coverage.policyIdentity !== coveragePolicyIdentity(policy(analysis.productId))
  )
    reasons.push("The purchasing policy changed after this analysis was requested.");
  let unavailable: string | null = null;
  if (reasons.length) unavailable = "Run a new analysis before using stock coverage.";
  else if (analysis.status !== "COMPLETED" || analysis.forecast?.status !== "COMPLETED")
    unavailable = analysis.error || "A completed demand forecast is required for stock coverage.";
  else if (!input.coverage)
    unavailable = "This historical run predates saved coverage inputs. Request a new analysis.";
  const coverage =
    !unavailable && input.coverage && analysis.forecast
      ? calculateStockCoverage({
          ...input.coverage,
          decisionDate: analysis.decisionDate,
          daily: analysis.forecast.p50,
        })
      : null;
  return {
    analysis,
    product: {
      id: String(product.id),
      sku: String(product.sku),
      name: String(product.name),
      unit: String(product.unit),
      precision: Number(product.precision),
    },
    input: {
      cutoffDate: input.cutoffDate,
      horizonDays: input.horizonDays,
      observations: input.values.length,
      inputHash: input.inputHash,
    },
    stale: reasons.length > 0,
    staleReasons: reasons,
    coverage,
    coverageUnavailableReason: unavailable,
  };
}

export function forecastAnalysis(role: Role, id: string): ForecastAnalysisResponse {
  seedDatabase();
  const row = getDb()
    .prepare("SELECT payload,request FROM analysis_runs WHERE org_id=? AND id=?")
    .get(ORG, text(id, "Analysis"));
  if (!row) fail("Forecast analysis not found.", 404, "NOT_FOUND");
  return { ...context(role), result: view(row) };
}

export function forecastAnalyses(
  role: Role,
  productId?: string,
  limit = 20,
): ForecastAnalysesResponse {
  seedDatabase();
  integer(limit, "Page size", 1, 100);
  if (productId !== undefined) productRow(text(productId, "Product"));
  const filter = productId === undefined ? "" : " AND product_id=?";
  const parameters = productId === undefined ? [ORG, limit] : [ORG, productId, limit];
  const rows = getDb()
    .prepare(
      `SELECT payload,request FROM analysis_runs WHERE org_id=?${filter} ORDER BY rowid DESC LIMIT ?`,
    )
    .all(...parameters);
  return { ...context(role), results: rows.map(view) };
}
