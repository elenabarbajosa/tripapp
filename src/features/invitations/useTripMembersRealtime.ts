import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { tripKeys } from "@/features/trips/hooks";
import { getSupabaseClient } from "@/services/supabase";

/** Invalidates trip detail when trip_members change for this trip. */
export function useTripMembersRealtime(tripId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !tripId) {
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    const channel = client
      .channel(`trip-members-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled, queryClient, tripId]);
}
