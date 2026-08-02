import { parseISODate } from "@/utils/date";

export interface DaySelectionItem {
  id: string;
  date: string;
}

/**
 * Picks the itinerary day to select by default:
 * today's date when it appears in the trip days, otherwise the first day.
 */
export function defaultSelectedDayId(
  days: DaySelectionItem[],
  todayISO: string,
): string | undefined {
  if (days.length === 0) {
    return undefined;
  }

  const todayMatch = days.find((day) => day.date === todayISO);
  if (todayMatch) {
    return todayMatch.id;
  }

  return days[0]?.id;
}

/** Weekday abbreviation + month/day for day selector chips (UTC). */
export function formatDayChipParts(dateISO: string): {
  weekday: string;
  monthDay: string;
} {
  const date = parseISODate(dateISO);
  return {
    weekday: date.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }),
    monthDay: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
  };
}
