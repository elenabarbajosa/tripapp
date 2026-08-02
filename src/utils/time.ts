/**
 * HH:mm time helpers for itinerary activities.
 * Pure string/number logic — no Date timezone conversion.
 */

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True when value is a valid 24-hour HH:mm string. */
export function isValidTimeHHmm(value: string | null | undefined): value is string {
  if (typeof value !== "string") {
    return false;
  }
  return HHMM_RE.test(value.trim());
}

/**
 * Normalizes Postgres `time` / HH:mm:ss / HH:mm into HH:mm, or null.
 * Returns null for blank or unparseable values.
 */
export function parseTimeToHHmm(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Formats an HH:mm (or longer) value as HH:mm, or returns null. */
export function formatTimeHHmm(value: string | null | undefined): string | null {
  return parseTimeToHHmm(value);
}

/**
 * Compares two HH:mm times.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 * Throws if either value is invalid.
 */
export function compareTimes(a: string, b: string): number {
  const left = parseTimeToHHmm(a);
  const right = parseTimeToHHmm(b);
  if (!left || !right) {
    throw new Error("Invalid HH:mm time");
  }
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

/** Minutes since midnight for a valid HH:mm value. */
export function timeToMinutes(value: string): number {
  const parsed = parseTimeToHHmm(value);
  if (!parsed) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  const [hours, minutes] = parsed.split(":").map(Number);
  return hours! * 60 + minutes!;
}
