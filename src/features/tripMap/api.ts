import { getTripBookings } from "@/features/bookings/api";
import { getTripIdeas } from "@/features/ideas/api";
import { getTripDaysWithActivities } from "@/features/itinerary/api";
import { getTripById } from "@/features/trips/api";
import { requireSupabaseClient } from "@/services/supabase";
import { isValidUuid } from "@/utils/routeParams";
import { ensureDestinationCoordinates } from "./geocode";
import { getTripMapErrorDebug, mapTripMapError } from "./errors";
import {
  buildRoutePoints,
  isMappedPoint,
  mapActivityPoint,
  mapBookingPoint,
  mapDestinationPoint,
  mapIdeaPoint,
  mapTripDays,
} from "./mappers";
import type { TripMapData, TripMapPoint, TripMapPointType, TripMapUnmappedItem } from "./types";

function logError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[tripMap:${context}]`, getTripMapErrorDebug(error));
}

async function requireCurrentUserId(): Promise<string | null> {
  try {
    const client = requireSupabaseClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Loads map points for a trip from destinations, activities, bookings, and ideas.
 * Destination geocoding failures never fail the whole query.
 */
export async function getTripMapData(tripId: string): Promise<TripMapData> {
  if (!isValidUuid(tripId)) {
    throw mapTripMapError(new Error("Trip id is required."));
  }
  const resolvedTripId = tripId.trim();

  try {
    const userId = await requireCurrentUserId();
    const [trip, daysWithActivities, bookings, ideas] = await Promise.all([
      getTripById(resolvedTripId),
      getTripDaysWithActivities(resolvedTripId),
      getTripBookings(resolvedTripId),
      getTripIdeas(resolvedTripId, userId),
    ]);

    if (!trip) {
      throw mapTripMapError(new Error("Trip not found."));
    }

    const { destinations, geocodeFailedIds } = await ensureDestinationCoordinates(
      trip.destinations,
    );

    const orderedDestinations = [...destinations].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    const points: TripMapPoint[] = [];
    const unmapped: TripMapUnmappedItem[] = [];

    orderedDestinations.forEach((destination, index) => {
      const mapped = mapDestinationPoint(destination, resolvedTripId, index + 1);
      if (isMappedPoint(mapped)) {
        points.push(mapped);
      } else {
        if (geocodeFailedIds.includes(destination.id)) {
          unmapped.push({ ...mapped, reason: "geocode_failed" });
        } else {
          unmapped.push(mapped);
        }
      }
    });

    const activities = daysWithActivities.flatMap((day) =>
      day.activities.map((activity) => ({
        ...activity,
        // ensure tripDayId present
        tripDayId: activity.tripDayId || day.id,
      })),
    );

    for (const activity of activities) {
      const mapped = mapActivityPoint(activity, resolvedTripId);
      if (isMappedPoint(mapped)) {
        points.push(mapped);
      } else if (
        activity.latitude != null ||
        activity.longitude != null ||
        activity.locationName ||
        activity.address
      ) {
        // Only report activities that attempted a place but lack usable coords.
        if (activity.latitude != null || activity.longitude != null || activity.geoapifyPlaceId) {
          unmapped.push(mapped);
        }
      }
    }

    for (const booking of bookings) {
      const mapped = mapBookingPoint(booking, resolvedTripId);
      if (isMappedPoint(mapped)) {
        points.push(mapped);
      } else if (booking.latitude != null || booking.longitude != null || booking.geoapifyPlaceId) {
        unmapped.push(mapped);
      }
    }

    for (const idea of ideas) {
      const mapped = mapIdeaPoint(idea, resolvedTripId);
      if (isMappedPoint(mapped)) {
        points.push(mapped);
      } else if (idea.latitude != null || idea.longitude != null || idea.geoapifyPlaceId) {
        unmapped.push(mapped);
      }
    }

    const days = mapTripDays(
      daysWithActivities.map((day) => ({
        id: day.id,
        tripId: day.tripId,
        date: day.date,
        label: day.label,
        destinationId: day.destinationId,
        destinationCity: day.destinationCity,
      })),
    );

    const typesPresent = Array.from(
      new Set(points.map((point) => point.type)),
    ) as TripMapPointType[];

    return {
      tripId: resolvedTripId,
      points,
      routePoints: buildRoutePoints(orderedDestinations, resolvedTripId),
      unmapped,
      days,
      typesPresent,
      bookingDateRanges: getBookingDateRanges(bookings),
    };
  } catch (error) {
    logError("getTripMapData", error);
    throw error instanceof Error ? error : mapTripMapError(error);
  }
}

export function getBookingDateRanges(
  bookings: { id: string; startDate: string | null; endDate: string | null }[],
): Map<string, { start: string | null; end: string | null }> {
  const map = new Map<string, { start: string | null; end: string | null }>();
  for (const booking of bookings) {
    map.set(booking.id, { start: booking.startDate, end: booking.endDate });
  }
  return map;
}
