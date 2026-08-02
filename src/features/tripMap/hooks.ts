import { useQuery, useQueryClient } from "@tanstack/react-query";

import { isValidUuid } from "@/utils/routeParams";
import { getTripMapData } from "./api";
import { geocodeTripDestination } from "./geocode";

export const tripMapKeys = {
  all: ["tripMap"] as const,
  trip: (tripId: string) => [...tripMapKeys.all, tripId] as const,
  geocode: (destinationId: string) =>
    [...tripMapKeys.all, "geocode", destinationId] as const,
};

export async function invalidateTripMap(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
): Promise<void> {
  if (!isValidUuid(tripId)) {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: tripMapKeys.trip(tripId.trim()) });
}

const STALE_MS = 60_000;

export function useTripMapQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: tripMapKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripMapData(resolvedId),
    enabled: canQuery,
    staleTime: STALE_MS,
    retry: 1,
  });
}

/**
 * Optional manual geocode retry for a single destination.
 * Invalidates only that trip's map query on success.
 */
export function useDestinationGeocodeQuery(
  tripId: string | undefined,
  destinationId: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  const resolvedDestinationId =
    typeof destinationId === "string" ? destinationId.trim() : "";
  const canQuery =
    enabled && isValidUuid(resolvedTripId) && isValidUuid(resolvedDestinationId);

  return useQuery({
    queryKey: tripMapKeys.geocode(canQuery ? resolvedDestinationId : ""),
    queryFn: async () => {
      const location = await geocodeTripDestination(resolvedDestinationId);
      if (location) {
        await invalidateTripMap(queryClient, resolvedTripId);
      }
      return location;
    },
    enabled: canQuery,
    staleTime: Infinity,
    retry: false,
  });
}
