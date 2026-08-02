import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isValidUuid } from "@/utils/routeParams";
import {
  createTripActivity,
  deleteTripActivity,
  getTripActivityById,
  getTripDaysWithActivities,
  reorderTripActivities,
  updateTripActivity,
  type CreateTripActivityInput,
  type DeleteTripActivityInput,
  type ReorderTripActivitiesInput,
  type UpdateTripActivityInput,
} from "./api";

export const itineraryKeys = {
  all: ["itinerary"] as const,
  trip: (tripId: string) => [...itineraryKeys.all, tripId] as const,
  activity: (tripId: string, activityId: string) =>
    [...itineraryKeys.trip(tripId), "activity", activityId] as const,
};

async function invalidateTripItinerary(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
  activityId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(tripId) }),
    activityId
      ? queryClient.invalidateQueries({
          queryKey: itineraryKeys.activity(tripId, activityId),
        })
      : Promise.resolve(),
  ]);
}

export function useTripItineraryQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: itineraryKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripDaysWithActivities(resolvedId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useTripActivityQuery(
  tripId: string | undefined,
  activityId: string | undefined,
  enabled: boolean,
) {
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  const resolvedActivityId = typeof activityId === "string" ? activityId.trim() : "";
  const canQuery =
    enabled && isValidUuid(resolvedTripId) && isValidUuid(resolvedActivityId);

  return useQuery({
    queryKey: itineraryKeys.activity(
      canQuery ? resolvedTripId : "",
      canQuery ? resolvedActivityId : "",
    ),
    queryFn: () => getTripActivityById(resolvedTripId, resolvedActivityId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useCreateTripActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripActivityInput) => createTripActivity(input),
    onSuccess: async (activity) => {
      await invalidateTripItinerary(queryClient, activity.tripId, activity.id);
    },
  });
}

export function useUpdateTripActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTripActivityInput) => updateTripActivity(input),
    onSuccess: async (activity) => {
      await invalidateTripItinerary(queryClient, activity.tripId, activity.id);
    },
  });
}

export function useDeleteTripActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripActivityInput) => deleteTripActivity(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripItinerary(queryClient, variables.tripId, variables.activityId);
    },
  });
}

export function useReorderTripActivitiesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderTripActivitiesInput) => reorderTripActivities(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripItinerary(queryClient, variables.tripId);
    },
  });
}
