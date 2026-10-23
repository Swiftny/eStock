import type { ForecastRequest, ForecastResult, SalesDay } from "../contracts.ts";
import { addDays, fail } from "./validation.ts";

const MODEL_ID = "amazon/chronos-bolt-small";

export function validateHistory(days: SalesDay[], cutoff: string) {
  const observed = days.filter((day) => day.date <= cutoff).slice(-168);
  if (observed.length < 28 || observed.at(-1)?.date !== cutoff)
    return {
      valid: false,
      reason: "At least 28 consecutive complete days ending at the cutoff are required.",
      days: observed,
    };
  for (let i = 0; i < observed.length; i++) {
    const day = observed[i];
    if (
      !day.complete ||
      !Number.isFinite(day.quantity) ||
      day.quantity < 0 ||
      day.quantity > 1000000 ||
      (i > 0 && addDays(observed[i - 1].date, 1) !== day.date)
    )
      return {
        valid: false,
        reason:
          "History contains an incomplete or missing day. Missing observations cannot be treated as zero.",
        days: observed,
      };
  }
  return { valid: true, reason: "", days: observed };
}

export function baseline(
  values: number[],
  horizon: number,
  method: "mean28" | "seasonal7" = "mean28",
) {
  const mean = values.slice(-28).reduce((a, b) => a + b, 0) / 28;
  return Array.from({ length: horizon }, (_, i) =>
    method === "mean28" ? mean : values[values.length - 7 + (i % 7)],
  );
}

export function selectBaseline(
  values: number[],
  horizon: number,
  flags: boolean[] = [],
): "mean28" | "seasonal7" {
  if (values.length < 168 || horizon > 44) return "mean28";
  const score = (method: "mean28" | "seasonal7") =>
    [58, 72].reduce(
      (sum, origin) =>
        sum +
        baseline(values.slice(0, origin), horizon, method).reduce(
          (error, value, index) =>
            error + (flags[origin + index] ? 0 : Math.abs(value - values[origin + index])),
          0,
        ),
      0,
    );
  return score("seasonal7") + 1e-9 < score("mean28") ? "seasonal7" : "mean28";
}

export function baselineResult(
  request: ForecastRequest,
  source: ForecastResult["source"],
  warning: string,
): ForecastResult {
  const method =
    source === "BASELINE_FALLBACK"
      ? "mean28"
      : selectBaseline(request.values, request.horizonDays, request.stockoutFlags);
  return {
    requestId: request.requestId,
    productId: request.productId,
    status: "COMPLETED",
    source,
    modelId: method === "mean28" ? "baseline/28-day-mean" : "baseline/7-day-seasonal-naive",
    modelRevision: "estock-baseline-v1",
    inputHash: request.inputHash,
    cutoffDate: request.cutoffDate,
    generatedAt: new Date().toISOString(),
    runtimeMs: 0,
    dates: Array.from({ length: request.horizonDays }, (_, i) =>
      addDays(request.cutoffDate, i + 1),
    ),
    p50: baseline(request.values, request.horizonDays, method),
    warnings: [
      warning,
      ...(request.stockoutFlags.some(Boolean)
        ? ["Stockout days may censor observed sales. Demand lost during stockouts is unknown."]
        : []),
    ],
  };
}

function configuration() {
  const endpoint = process.env.RUNPOD_ENDPOINT_ID || "";
  const key = process.env.RUNPOD_API_KEY || "";
  const revision = process.env.CHRONOS_MODEL_REVISION || "";
  if (!/^[a-zA-Z0-9_-]+$/.test(endpoint) || !key || !/^[a-f0-9]{40}$/.test(revision))
    fail(
      "RunPod needs an endpoint, server-side API key and pinned 40-character model revision. See worker/README.md.",
      503,
      "CONFIGURATION",
    );
  return { endpoint, key, revision };
}

export function forecastConfigIdentity() {
  const mode = process.env.FORECAST_MODE || "MOCK";
  if (!["MOCK", "RUNPOD"].includes(mode))
    fail("FORECAST_MODE must be MOCK or RUNPOD.", 503, "CONFIGURATION");
  return mode === "RUNPOD"
    ? `RUNPOD:${process.env.RUNPOD_ENDPOINT_ID || "unconfigured"}:${process.env.CHRONOS_MODEL_REVISION || "unconfigured"}`
    : "MOCK:estock-baseline-v1";
}

async function provider(path: string, body?: unknown) {
  const { endpoint, key } = configuration();
  const response = await fetch(`https://api.runpod.ai/v2/${endpoint}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if ([401, 403].includes(response.status) || (response.status === 404 && path === "run"))
    fail(
      "RunPod rejected the credentials or endpoint. Check server secrets.",
      503,
      "CONFIGURATION",
    );
  if (!response.ok) throw new Error(`RunPod returned HTTP ${response.status}`);
  try {
    const job: unknown = await response.json();
    if (job && typeof job === "object" && !Array.isArray(job))
      return job as Record<string, unknown>;
  } catch {
    fail("RunPod returned invalid JSON.", 502, "FORECAST_INVALID");
  }
  fail("RunPod returned an invalid job response.", 502, "FORECAST_INVALID");
}

export function validateResult(raw: unknown, request: ForecastRequest): ForecastResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    fail("Forecast worker returned an invalid response.", 502, "FORECAST_INVALID");
  const result = raw as ForecastResult;
  if (
    result.status !== "COMPLETED" ||
    result.requestId !== request.requestId ||
    result.productId !== request.productId ||
    !["RUNPOD", "BASELINE_SELECTED", "BASELINE_FALLBACK"].includes(result.source) ||
    result.inputHash !== request.inputHash ||
    result.cutoffDate !== request.cutoffDate ||
    result.modelRevision !== (request.modelRevision || configuration().revision) ||
    result.modelId !== "amazon/chronos-bolt-small" ||
    typeof result.device !== "string" ||
    !result.device.trim() ||
    !Array.isArray(result.modelP50) ||
    result.modelP50.length !== request.horizonDays ||
    result.modelP50.some(
      (value) =>
        typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1000000,
    ) ||
    !Number.isFinite(result.runtimeMs) ||
    result.runtimeMs < 0 ||
    typeof result.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(result.generatedAt)) ||
    !Array.isArray(result.dates) ||
    !Array.isArray(result.p50) ||
    result.p50.length !== request.horizonDays ||
    result.dates.length !== request.horizonDays ||
    !Array.isArray(result.warnings) ||
    result.warnings.some((item) => typeof item !== "string") ||
    (result.device !== undefined &&
      (typeof result.device !== "string" || !result.device.trim() || result.device.length > 200)) ||
    (result.evaluation !== undefined &&
      (!result.evaluation ||
        typeof result.evaluation !== "object" ||
        Array.isArray(result.evaluation)))
  )
    fail(
      "Forecast metadata, dates or length do not match the submitted request.",
      502,
      "FORECAST_INVALID",
    );
  const warnings = [...result.warnings];
  const quantities = (values: number[]) =>
    values.map((value) => {
      if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1_000_000)
        fail("Forecast contains invalid quantities or dates.", 502, "FORECAST_INVALID");
      if (value < 0) warnings.push("Negative model output clipped to zero.");
      return Math.max(0, value);
    });
  if (result.dates.some((value, i) => value !== addDays(request.cutoffDate, i + 1)))
    fail("Forecast dates do not match the requested horizon.", 502, "FORECAST_INVALID");
  if (
    result.modelP50 !== undefined &&
    (!Array.isArray(result.modelP50) || result.modelP50.length !== request.horizonDays)
  )
    fail("Raw model forecast length does not match the request.", 502, "FORECAST_INVALID");
  const p50 = quantities(result.p50);
  const modelP50 = result.modelP50 === undefined ? undefined : quantities(result.modelP50);
  return {
    status: "COMPLETED",
    source: result.source,
    requestId: request.requestId,
    productId: request.productId,
    modelId: MODEL_ID,
    modelRevision: result.modelRevision,
    inputHash: result.inputHash,
    cutoffDate: result.cutoffDate,
    generatedAt: result.generatedAt,
    runtimeMs: result.runtimeMs,
    dates: [...result.dates],
    p50,
    warnings: [...new Set(warnings)],
    ...(modelP50 === undefined ? {} : { modelP50 }),
    ...(result.device === undefined ? {} : { device: result.device }),
    ...(result.evaluation === undefined ? {} : { evaluation: result.evaluation }),
  };
}

function providerJobId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(value))
    fail("RunPod returned an invalid job identifier.", 502, "FORECAST_INVALID");
  return value;
}

export async function submitForecast(request: ForecastRequest): Promise<ForecastResult> {
  const identity = forecastConfigIdentity();
  if (identity.startsWith("MOCK:"))
    return baselineResult(
      request,
      "MOCK_BASELINE",
      "MOCK adapter: saved-history baseline calculation on this server. No AI inference.",
    );
  const { revision } = configuration();
  if (request.modelRevision && request.modelRevision !== revision)
    fail(
      "Forecast configuration changed before submission. Review the saved run.",
      503,
      "CONFIGURATION",
    );
  const { requestId, productId, cutoffDate, horizonDays, inputHash, dates, values, stockoutFlags } =
    request;
  const job = await provider("run", {
    input: {
      requestId,
      productId,
      cutoffDate,
      horizonDays,
      inputHash,
      dates,
      values,
      stockoutFlags,
      modelId: MODEL_ID,
      modelRevision: revision,
    },
  });
  if (job.status === "COMPLETED")
    return {
      ...validateResult(job.output, request),
      ...(typeof job.id === "string" ? { jobId: job.id } : {}),
    };
  if (job.status !== "IN_QUEUE" && job.status !== "IN_PROGRESS")
    throw new Error("RunPod did not accept the forecast job.");
  return {
    requestId,
    productId,
    status: "PENDING",
    jobId: providerJobId(job.id),
    source: "RUNPOD",
    modelId: MODEL_ID,
    modelRevision: revision,
    inputHash: request.inputHash,
    cutoffDate: request.cutoffDate,
    generatedAt: new Date().toISOString(),
    runtimeMs: 0,
    dates: [],
    p50: [],
    warnings: [],
  };
}

export async function pollForecast(
  request: ForecastRequest,
  jobId: string,
): Promise<ForecastResult | null> {
  providerJobId(jobId);
  const job = await provider(`status/${jobId}`);
  if (job.id && job.id !== jobId)
    fail("Provider job identity does not match the saved job.", 502, "FORECAST_INVALID");
  if (job.status === "IN_QUEUE" || job.status === "IN_PROGRESS") return null;
  if (job.status !== "COMPLETED") throw new Error("RunPod forecast job failed or expired.");
  return { ...validateResult(job.output, request), jobId };
}
