export class DomainError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 422, code = "VALIDATION") {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
  }
}
export function fail(message: string, status = 422, code = "VALIDATION"): never {
  throw new DomainError(message, status, code);
}
export function text(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${label} is required and must be ${max} characters or fewer.`);
  return value.trim();
}
export function optionalText(value: unknown, label: string, max = 200): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.trim().length > max)
    fail(`${label} must be text of ${max} characters or fewer.`);
  return value.trim();
}
export function number(value: unknown, label: string, minimum = 0, maximum = 1_000_000): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum)
    fail(`${label} must be a number between ${minimum} and ${maximum}.`);
  return value;
}
export function integer(
  value: unknown,
  label: string,
  minimum = 0,
  maximum = 1_000_000_000,
): number {
  const result = number(value, label, minimum, maximum);
  if (!Number.isInteger(result)) fail(`${label} must be a whole number.`);
  return result;
}
export function quantity(
  value: unknown,
  precision: number,
  label = "Quantity",
  allowZero = false,
): number {
  const result = number(value, label, allowZero ? 0 : 0.001);
  const scaled = result * 10 ** precision;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-7)
    fail(`${label} allows ${precision} decimal places.`);
  return Math.round(result * 1000);
}
export function date(value: unknown, label = "Date"): string {
  const result = text(value, label, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    Number.isNaN(Date.parse(`${result}T00:00:00Z`)) ||
    new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result
  )
    fail(`${label} must be a valid calendar date.`);
  return result;
}
export function addDays(value: string, days: number): string {
  return new Date(Date.parse(`${value}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function requireManager(role: string) {
  if (role !== "manager")
    fail("A demo manager session is required for this action.", 403, "FORBIDDEN");
}
