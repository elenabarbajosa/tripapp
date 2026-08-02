import type { TripActivityRow, TripDayRow } from "@/types/database";
import type { TripActivity, TripDaySummary } from "@/types/models";
import { parseTimeToHHmm } from "@/utils/time";

export type TripDayRowWithDestination = TripDayRow & {
  trip_destinations?: { city: string } | { city: string }[] | null;
};

export type TripActivityRowWithDestination = TripActivityRow & {
  trip_destinations?: { city: string } | { city: string }[] | null;
};

function nestedCity(
  value: { city: string } | { city: string }[] | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0]?.city ?? null;
  }
  return value.city ?? null;
}

export function mapDayRow(row: TripDayRowWithDestination): TripDaySummary {
  return {
    id: row.id,
    tripId: row.trip_id,
    date: row.date,
    label: row.label,
    destinationId: row.destination_id,
    destinationCity: nestedCity(row.trip_destinations),
  };
}

export function mapActivityRow(row: TripActivityRowWithDestination): TripActivity {
  return {
    id: row.id,
    tripId: row.trip_id,
    tripDayId: row.trip_day_id,
    destinationId: row.destination_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    category: row.category,
    isAllDay: row.is_all_day,
    startTime: parseTimeToHHmm(row.start_time),
    endTime: parseTimeToHHmm(row.end_time),
    locationName: row.location_name,
    address: row.address,
    notes: row.notes,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    destinationCity: nestedCity(row.trip_destinations),
  };
}

/**
 * ORDERING RULE: all-day first, then start_time ascending (nulls last among timed),
 * then position ascending, then created_at ascending.
 */
export function sortActivities(activities: TripActivity[]): TripActivity[] {
  return [...activities].sort((a, b) => {
    if (a.isAllDay !== b.isAllDay) {
      return a.isAllDay ? -1 : 1;
    }

    const aTime = a.startTime;
    const bTime = b.startTime;
    if (aTime !== bTime) {
      if (aTime == null) {
        return 1;
      }
      if (bTime == null) {
        return -1;
      }
      if (aTime < bTime) {
        return -1;
      }
      if (aTime > bTime) {
        return 1;
      }
    }

    if (a.position !== b.position) {
      return a.position - b.position;
    }

    if (a.createdAt < b.createdAt) {
      return -1;
    }
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    return 0;
  });
}
