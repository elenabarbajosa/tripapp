/**
 * Pure date helpers used across screens and tests.
 * No timezone libraries in Phase 1 — ISO date strings (YYYY-MM-DD) only.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDisplayDate(value: string): string {
  const date = parseISODate(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(value: string): string {
  const date = parseISODate(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

export function daysUntil(startDate: string, today: string = toISODate(new Date())): number {
  const start = parseISODate(startDate).getTime();
  const current = parseISODate(today).getTime();
  return Math.ceil((start - current) / DAY_MS);
}

export function toISODate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCountdown(startDate: string, today?: string): string {
  const remaining = daysUntil(startDate, today);
  if (remaining > 1) {
    return `${remaining} days to go`;
  }
  if (remaining === 1) {
    return "Tomorrow";
  }
  if (remaining === 0) {
    return "Today";
  }
  return "In progress";
}

export function formatTimeLabel(time: string): string {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}
