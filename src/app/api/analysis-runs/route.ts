import type { NextRequest } from "next/server";
import {
  forecastError,
  forecastJson,
  forecastMutationRequest,
  forecastSession,
} from "@/lib/server/forecasting/http";
import { startForecast } from "@/lib/server/forecasting/mutations";
import { forecastAnalyses } from "@/lib/server/forecasting/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    const role = forecastSession(request);
    const query = new URL(request.url).searchParams;
    return forecastJson(
      forecastAnalyses(
        role,
        query.has("productId") ? (query.get("productId") ?? "") : undefined,
        query.has("limit") ? Number(query.get("limit")) : 20,
      ),
    );
  } catch (error) {
    return forecastError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, key, input } = await forecastMutationRequest(request);
    const result = await startForecast(role, input, key);
    return forecastJson(result, result.result.analysis.status === "PENDING" ? 202 : 200);
  } catch (error) {
    return forecastError(error);
  }
}
