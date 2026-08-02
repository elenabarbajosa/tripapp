import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { itineraryKeys } from "@/features/itinerary/hooks";
import { requireSupabaseClient } from "@/services/supabase";
import { isValidUuid } from "@/utils/routeParams";
import {
  archiveTripIdea,
  createTripIdea,
  deleteTripIdea,
  getTripIdeaById,
  getTripIdeas,
  promoteTripIdeaToActivity,
  unvoteIdea,
  updateTripIdea,
  voteForIdea,
  type CreateTripIdeaInput,
  type DeleteTripIdeaInput,
  type PromoteTripIdeaInput,
  type UpdateTripIdeaInput,
  type VoteOnIdeaInput,
} from "./api";

export const ideaKeys = {
  all: ["ideas"] as const,
  trip: (tripId: string, userId?: string) =>
    [...ideaKeys.all, tripId, userId ?? ""] as const,
  idea: (tripId: string, ideaId: string, userId?: string) =>
    [...ideaKeys.trip(tripId, userId), "idea", ideaId] as const,
};

async function invalidateTripIdeas(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: [...ideaKeys.all, tripId] });
}

export function useTripIdeasQuery(
  tripId: string | undefined,
  currentUserId: string | undefined,
  enabled: boolean,
) {
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canQuery = enabled && isValidUuid(resolvedId);

  return useQuery({
    queryKey: ideaKeys.trip(canQuery ? resolvedId : "", currentUserId),
    queryFn: () => getTripIdeas(resolvedId, currentUserId),
    enabled: canQuery,
    retry: 1,
  });
}

export function useTripIdeaQuery(
  tripId: string | undefined,
  ideaId: string | undefined,
  currentUserId: string | undefined,
  enabled: boolean,
) {
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  const resolvedIdeaId = typeof ideaId === "string" ? ideaId.trim() : "";
  const canQuery =
    enabled && isValidUuid(resolvedTripId) && isValidUuid(resolvedIdeaId);

  return useQuery({
    queryKey: ideaKeys.idea(
      canQuery ? resolvedTripId : "",
      canQuery ? resolvedIdeaId : "",
      currentUserId,
    ),
    queryFn: () => getTripIdeaById(resolvedTripId, resolvedIdeaId, currentUserId),
    enabled: canQuery,
    retry: 1,
  });
}

/** Subscribes to trip_ideas and trip_idea_votes changes so vote counts stay live. */
export function useIdeasRealtime(tripId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const resolvedId = typeof tripId === "string" ? tripId.trim() : "";
  const canSubscribe = enabled && isValidUuid(resolvedId);

  useEffect(() => {
    if (!canSubscribe) {
      return;
    }
    const client = requireSupabaseClient();
    const invalidate = () => {
      void invalidateTripIdeas(queryClient, resolvedId);
    };
    const channel = client
      .channel(`ideas:${resolvedId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_ideas",
          filter: `trip_id=eq.${resolvedId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_idea_votes",
        },
        invalidate,
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [canSubscribe, resolvedId, queryClient]);
}

export function useCreateTripIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripIdeaInput) => createTripIdea(input),
    onSuccess: async (idea) => {
      await invalidateTripIdeas(queryClient, idea.tripId);
    },
  });
}

export function useUpdateTripIdeaMutation(currentUserId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTripIdeaInput) => updateTripIdea(input, currentUserId),
    onSuccess: async (idea) => {
      await invalidateTripIdeas(queryClient, idea.tripId);
    },
  });
}

export function useDeleteTripIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripIdeaInput) => deleteTripIdea(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripIdeas(queryClient, variables.tripId);
    },
  });
}

export function useArchiveTripIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTripIdeaInput) => archiveTripIdea(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripIdeas(queryClient, variables.tripId);
    },
  });
}

export function useVoteForIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VoteOnIdeaInput) => voteForIdea(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripIdeas(queryClient, variables.tripId);
    },
  });
}

export function useUnvoteIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VoteOnIdeaInput) => unvoteIdea(input),
    onSuccess: async (_data, variables) => {
      await invalidateTripIdeas(queryClient, variables.tripId);
    },
  });
}

export function usePromoteTripIdeaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoteTripIdeaInput) => promoteTripIdeaToActivity(input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTripIdeas(queryClient, variables.tripId),
        queryClient.invalidateQueries({ queryKey: itineraryKeys.trip(variables.tripId) }),
      ]);
    },
  });
}
