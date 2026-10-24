import type { Role } from "../../contracts.ts";
import { executeAction, processAnalysis } from "../service.ts";
import { fail, requireManager } from "../validation.ts";
import { forecastAnalysis } from "./queries.ts";

export async function startForecast(role: Role, input: Record<string, unknown>, key: string) {
  requireManager(role);
  const saved = executeAction(role, "analyse", input, key);
  if (!saved.entityId) fail("Analysis identifier was not saved.", 500);
  if (saved.processId) await processAnalysis(saved.processId);
  return forecastAnalysis(role, saved.entityId);
}

export async function pollSavedForecast(role: Role, id: string, key: string) {
  requireManager(role);
  const saved = executeAction(role, "pollAnalysis", { analysisId: id }, key);
  if (saved.processId) await processAnalysis(saved.processId, true);
  return forecastAnalysis(role, id);
}
