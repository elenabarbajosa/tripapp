import { requireSupabaseClient } from "@/services/supabase";
import type { TripDestination } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { getTripMapErrorDebug, mapTripMapError } from "./errors";
import { isValidMapCoordinate } from "./mappers";

export type GeocodedDestinationLocation = {
  destinationId: string;
  tripId: string;
  city: string;
  country: string;
  countryCode: string | null;
  displayOrder: number;
  latitude: number;
  longitude: number;
  geoapifyPlaceId: string | null;
  geocodedAt: string | null;
  cached: boolean;
};

const inflight = new Map<string, Promise<GeocodedDestinationLocation | null>>();

function logGeocodeError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[tripMap:${context}]`, getTripMapErrorDebug(error));
}

/**
 * Geocodes a destination via the Edge Function. Deduplicates concurrent requests
 * for the same destination id. Returns null on failure (never throws for map load).
 */
export async function geocodeTripDestination(
  destinationId: string,
): Promise<GeocodedDestinationLocation | null> {
  if (!isValidUuid(destinationId)) {
    return null;
  }
  const key = destinationId.trim();
  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<GeocodedDestinationLocation | null> => {
    try {
      const client = requireSupabaseClient();
      const { data, error } = await client.functions.invoke(
        "geoapify-geocode-destination",
        {
          body: { destinationId: key },
        },
      );

      if (error) {
        logGeocodeError("geocodeTripDestination", error);
        return null;
      }

      const payload = data as {
        cached?: boolean;
        location?: {
          destinationId?: string;
          tripId?: string;
          city?: string;
          country?: string;
          countryCode?: string | null;
          displayOrder?: number;
          latitude?: number | null;
          longitude?: number | null;
          geoapifyPlaceId?: string | null;
          geocodedAt?: string | null;
        };
        error?: string;
      } | null;

      const location = payload?.location;
      if (
        !location ||
        !isValidUuid(location.destinationId) ||
        !isValidUuid(location.tripId) ||
        !isValidMapCoordinate(location.latitude, location.longitude)
      ) {
        return null;
      }

      return {
        destinationId: location.destinationId,
        tripId: location.tripId,
        city: location.city ?? "",
        country: location.country ?? "",
        countryCode: location.countryCode ?? null,
        displayOrder:
          typeof location.displayOrder === "number" ? location.displayOrder : 0,
        latitude: location.latitude as number,
        longitude: location.longitude as number,
        geoapifyPlaceId: location.geoapifyPlaceId ?? null,
        geocodedAt: location.geocodedAt ?? null,
        cached: Boolean(payload?.cached),
      };
    } catch (error) {
      logGeocodeError("geocodeTripDestination", error);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Test helper — clears in-flight geocode dedupe state. */
export function clearGeocodeInflightForTests(): void {
  inflight.clear();
}

export function applyGeocodeToDestination(
  destination: TripDestination,
  location: GeocodedDestinationLocation,
): TripDestination {
  return {
    ...destination,
    latitude: location.latitude,
    longitude: location.longitude,
    geoapifyPlaceId: location.geoapifyPlaceId,
    geocodedAt: location.geocodedAt,
  };
}

export async function ensureDestinationCoordinates(
  destinations: TripDestination[],
): Promise<{
  destinations: TripDestination[];
  geocodeFailedIds: string[];
}> {
  const geocodeFailedIds: string[] = [];
  const next = await Promise.all(
    destinations.map(async (destination) => {
      if (isValidMapCoordinate(destination.latitude, destination.longitude)) {
        return destination;
      }
      const location = await geocodeTripDestination(destination.id);
      if (!location) {
        geocodeFailedIds.push(destination.id);
        return destination;
      }
      return applyGeocodeToDestination(destination, location);
    }),
  );
  return { destinations: next, geocodeFailedIds };
}

export function assertGeocodeDestinationId(destinationId: string): string {
  if (!isValidUuid(destinationId)) {
    throw mapTripMapError(new Error("A valid destination id is required."));
  }
  return destinationId.trim();
}
