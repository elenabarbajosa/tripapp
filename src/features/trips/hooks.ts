import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTrip,
  deleteTrip,
  getTripById,
  listMyTrips,
  type CreateTripInput,
} from "./api";

export const tripKeys = {
  all: ["trips"] as const,
  lists: () => [...tripKeys.all, "list"] as const,
  detail: (tripId: string) => [...tripKeys.all, "detail", tripId] as const,
};

export function useMyTripsQuery(enabled: boolean) {
  return useQuery({
    queryKey: tripKeys.lists(),
    queryFn: listMyTrips,
    enabled,
  });
}

export function useTripQuery(tripId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: tripKeys.detail(tripId ?? ""),
    queryFn: () => getTripById(tripId!),
    enabled: Boolean(tripId) && enabled,
  });
}

export function useCreateTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useDeleteTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => deleteTrip(tripId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}
