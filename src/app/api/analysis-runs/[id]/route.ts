import type { NextRequest } from "next/server";
import { forecastError, forecastJson, forecastSession } from "@/lib/server/forecasting/http";
import { forecastAnalysis } from "@/lib/server/forecasting/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const role = forecastSession(request);
    const { id } = await context.params;
    return forecastJson(forecastAnalysis(role, id));
  } catch (error) {
    return forecastError(error);
  }
}
