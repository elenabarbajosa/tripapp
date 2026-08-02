import type {
  TripActivity,
  TripBooking,
  TripDaySummary,
  TripDestination,
  TripIdea,
} from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import type {
  TripMapPoint,
  TripMapRoutePoint,
  TripMapUnmappedItem,
} from "./types";

export function isValidMapCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function discardUnmapped(
  entityId: string,
  tripId: string,
  type: TripMapUnmappedItem["type"],
  title: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): TripMapUnmappedItem {
  const reason =
    latitude == null || longitude == null
      ? "missing_coordinates"
      : "invalid_coordinates";
  return { entityId, tripId, type, title, reason };
}

export function mapDestinationPoint(
  destination: TripDestination,
  tripId: string,
  stopNumber: number,
): TripMapPoint | TripMapUnmappedItem {
  if (!isValidUuid(destination.id) || !isValidUuid(tripId)) {
    return discardUnmapped(
      destination.id,
      tripId,
      "destination",
      destination.city,
      destination.latitude,
      destination.longitude,
    );
  }
  if (!isValidMapCoordinate(destination.latitude, destination.longitude)) {
    return discardUnmapped(
      destination.id,
      tripId,
      "destination",
      destination.city,
      destination.latitude,
      destination.longitude,
    );
  }
  const latitude = destination.latitude as number;
  const longitude = destination.longitude as number;
  return {
    id: `destination:${destination.id}`,
    entityId: destination.id,
    tripId,
    type: "destination",
    title: destination.city,
    subtitle: destination.country,
    latitude,
    longitude,
    category: "destination",
    date: destination.arrivalDate,
    tripDayId: null,
    destinationId: destination.id,
    address: [destination.city, destination.country].filter(Boolean).join(", "),
    stopNumber,
  };
}

export function mapActivityPoint(
  activity: TripActivity,
  tripId: string,
): TripMapPoint | TripMapUnmappedItem {
  if (!isValidUuid(activity.id) || !isValidUuid(tripId)) {
    return discardUnmapped(
      activity.id,
      tripId,
      "activity",
      activity.title,
      activity.latitude,
      activity.longitude,
    );
  }
  if (!isValidMapCoordinate(activity.latitude, activity.longitude)) {
    return discardUnmapped(
      activity.id,
      tripId,
      "activity",
      activity.title,
      activity.latitude,
      activity.longitude,
    );
  }
  return {
    id: `activity:${activity.id}`,
    entityId: activity.id,
    tripId,
    type: "activity",
    title: activity.title,
    subtitle: activity.locationName,
    latitude: activity.latitude as number,
    longitude: activity.longitude as number,
    category: activity.category,
    date: null,
    tripDayId: activity.tripDayId,
    destinationId: activity.destinationId,
    address: activity.address,
    stopNumber: null,
  };
}

export function mapBookingPoint(
  booking: TripBooking,
  tripId: string,
): TripMapPoint | TripMapUnmappedItem {
  if (!isValidUuid(booking.id) || !isValidUuid(tripId)) {
    return discardUnmapped(
      booking.id,
      tripId,
      "booking",
      booking.title,
      booking.latitude,
      booking.longitude,
    );
  }
  if (!isValidMapCoordinate(booking.latitude, booking.longitude)) {
    return discardUnmapped(
      booking.id,
      tripId,
      "booking",
      booking.title,
      booking.latitude,
      booking.longitude,
    );
  }
  return {
    id: `booking:${booking.id}`,
    entityId: booking.id,
    tripId,
    type: "booking",
    title: booking.title,
    subtitle: booking.providerName ?? booking.locationName,
    latitude: booking.latitude as number,
    longitude: booking.longitude as number,
    category: booking.bookingType,
    date: booking.startDate,
    tripDayId: null,
    destinationId: null,
    address: booking.address,
    stopNumber: null,
  };
}

export function mapIdeaPoint(
  idea: TripIdea,
  tripId: string,
): TripMapPoint | TripMapUnmappedItem {
  if (!isValidUuid(idea.id) || !isValidUuid(tripId)) {
    return discardUnmapped(
      idea.id,
      tripId,
      "idea",
      idea.title,
      idea.latitude,
      idea.longitude,
    );
  }
  if (!isValidMapCoordinate(idea.latitude, idea.longitude)) {
    return discardUnmapped(
      idea.id,
      tripId,
      "idea",
      idea.title,
      idea.latitude,
      idea.longitude,
    );
  }
  return {
    id: `idea:${idea.id}`,
    entityId: idea.id,
    tripId,
    type: "idea",
    title: idea.title,
    subtitle: idea.locationName,
    latitude: idea.latitude as number,
    longitude: idea.longitude as number,
    category: idea.category,
    date: null,
    tripDayId: null,
    destinationId: idea.destinationId,
    address: idea.address,
    stopNumber: null,
  };
}

export function isMappedPoint(
  value: TripMapPoint | TripMapUnmappedItem,
): value is TripMapPoint {
  return "latitude" in value && typeof value.latitude === "number";
}

export function buildRoutePoints(
  destinations: TripDestination[],
  tripId: string,
): TripMapRoutePoint[] {
  const ordered = [...destinations].sort((a, b) => a.displayOrder - b.displayOrder);
  const route: TripMapRoutePoint[] = [];
  let stop = 1;
  for (const destination of ordered) {
    if (!isValidMapCoordinate(destination.latitude, destination.longitude)) {
      continue;
    }
    if (!isValidUuid(destination.id)) {
      continue;
    }
    route.push({
      destinationId: destination.id,
      tripId,
      title: destination.city,
      latitude: destination.latitude as number,
      longitude: destination.longitude as number,
      displayOrder: destination.displayOrder,
      stopNumber: stop,
    });
    stop += 1;
  }
  return route;
}

export function mapTripDays(days: TripDaySummary[]): {
  id: string;
  date: string;
  label: string | null;
}[] {
  return days
    .filter((day) => isValidUuid(day.id))
    .map((day) => ({
      id: day.id,
      date: day.date,
      label: day.label,
    }));
}
