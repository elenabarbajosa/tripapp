import type { TripMapDayOption, TripMapPoint, TripMapPointType } from "./types";

export type TripMapTypeFilter = TripMapPointType;

export type TripMapFilterState = {
  /** Empty set means “all types”. */
  types: Set<TripMapPointType>;
  /** null means all days. */
  dayId: string | null;
  /** When a day is selected, ideas stay hidden unless this is true. */
  includeIdeasOnDay: boolean;
  showRoute: boolean;
};

export const DEFAULT_MAP_FILTER_STATE: TripMapFilterState = {
  types: new Set(),
  dayId: null,
  includeIdeasOnDay: false,
  showRoute: true,
};

export function toggleTypeFilter(
  current: Set<TripMapPointType>,
  type: TripMapPointType,
): Set<TripMapPointType> {
  const next = new Set(current);
  if (next.size === 0) {
    // Starting from "all" — select only this type by excluding others is awkward;
    // instead seed all types then remove the untoggled ones is worse UX.
    // Spec: allow multiple types visible. From All, tapping one means "only this".
    next.add(type);
    return next;
  }
  if (next.has(type)) {
    next.delete(type);
    return next;
  }
  next.add(type);
  return next;
}

/**
 * When the set is empty, all types are visible (All).
 * When non-empty, only listed types are visible.
 */
export function isTypeVisible(
  types: Set<TripMapPointType>,
  type: TripMapPointType,
): boolean {
  return types.size === 0 || types.has(type);
}

function bookingIncludesDate(point: TripMapPoint, dayDate: string): boolean {
  if (!point.date) {
    return false;
  }
  // Bookings store start date; end may be absent — treat as same-day when only start exists.
  // The point.date is startDate; for range we rely on optional address field? Better pass end in date field?
  // For Phase 5A we encode "YYYY-MM-DD" start; if booking has only start, same-day match.
  return point.date === dayDate;
}

/**
 * Filters map points locally — does not refetch Supabase.
 *
 * Day filter rules:
 * - Destinations always remain for geographic context.
 * - Activities match the selected trip day id.
 * - Bookings match when start date equals the selected day date (same-day).
 * - Ideas stay visible under All days; on a day filter only if includeIdeasOnDay.
 * - Undated non-destination items stay under All days only.
 */
export function filterMapPoints(
  points: TripMapPoint[],
  filters: TripMapFilterState,
  days: TripMapDayOption[],
  bookingDateRanges?: Map<string, { start: string | null; end: string | null }>,
): TripMapPoint[] {
  const selectedDay = filters.dayId
    ? days.find((day) => day.id === filters.dayId) ?? null
    : null;

  return points.filter((point) => {
    if (!isTypeVisible(filters.types, point.type)) {
      return false;
    }

    if (!selectedDay) {
      return true;
    }

    if (point.type === "destination") {
      return true;
    }

    if (point.type === "activity") {
      return point.tripDayId === selectedDay.id;
    }

    if (point.type === "booking") {
      const range = bookingDateRanges?.get(point.entityId);
      const start = range?.start ?? point.date;
      const end = range?.end ?? point.date;
      if (!start) {
        return false;
      }
      const endDate = end ?? start;
      return start <= selectedDay.date && endDate >= selectedDay.date;
    }

    if (point.type === "idea") {
      return filters.includeIdeasOnDay;
    }

    return bookingIncludesDate(point, selectedDay.date);
  });
}
