import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requireSupabaseClient } from "@/services/supabase";
import { isValidUuid } from "@/utils/routeParams";
import {
  createPackingItem,
  deletePackingItem,
  getTripPackingItems,
  reorderPackingItems,
  togglePackingItem,
  updatePackingItem,
  type CreatePackingItemInput,
  type UpdatePackingItemInput,
} from "./api";

export const packingKeys = {
  all: ["packing"] as const,
  trip: (tripId: string) => [...packingKeys.all, tripId] as const,
};

export function useTripPackingQuery(tripId: string | undefined, enabled: boolean) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);
  return useQuery({
    queryKey: packingKeys.trip(canQuery ? resolvedId : ""),
    queryFn: () => getTripPackingItems(resolvedId),
    enabled: canQuery,
    retry: 1,
  });
}

export function usePackingRealtime(tripId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canSubscribe = enabled && isValidUuid(resolvedId);

  useEffect(() => {
    if (!canSubscribe) {
      return;
    }
    const client = requireSupabaseClient();
    const channel = client
      .channel(`packing:${resolvedId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_packing_items",
          filter: `trip_id=eq.${resolvedId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: packingKeys.trip(resolvedId) });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [canSubscribe, resolvedId, queryClient]);
}

export function useCreatePackingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePackingItemInput) => createPackingItem(input),
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: packingKeys.trip(item.tripId) });
    },
  });
}

export function useUpdatePackingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePackingItemInput) => updatePackingItem(input),
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: packingKeys.trip(item.tripId) });
    },
  });
}

export function useDeletePackingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tripId: string; itemId: string }) =>
      deletePackingItem(input.tripId, input.itemId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: packingKeys.trip(variables.tripId) });
    },
  });
}

export function useTogglePackingItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tripId: string; itemId: string }) =>
      togglePackingItem(input.tripId, input.itemId),
    onSuccess: async (item) => {
      await queryClient.invalidateQueries({ queryKey: packingKeys.trip(item.tripId) });
    },
  });
}

export function useReorderPackingItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tripId: string; itemIds: string[] }) =>
      reorderPackingItems(input.tripId, input.itemIds),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: packingKeys.trip(variables.tripId) });
    },
  });
}
