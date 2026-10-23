import type { NextRequest } from "next/server";
import {
  forecastError,
  forecastJson,
  forecastMutationRequest,
} from "@/lib/server/forecasting/http";
import { pollSavedForecast } from "@/lib/server/forecasting/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { role, key } = await forecastMutationRequest(request);
    const { id } = await context.params;
    const result = await pollSavedForecast(role, id, key);
    return forecastJson(result, result.result.analysis.status === "PENDING" ? 202 : 200);
  } catch (error) {
    return forecastError(error);
  }
}
