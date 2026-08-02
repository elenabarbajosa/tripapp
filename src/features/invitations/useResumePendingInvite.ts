import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";

import { loadPendingInviteToken } from "./pendingInviteStorage";

/**
 * After auth lands on Home, resume a deep-link invite once if a token was stored.
 */
export function useResumePendingInvite(enabled: boolean) {
  const router = useRouter();
  const resumedRef = useRef(false);

  useEffect(() => {
    if (!enabled || resumedRef.current) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const token = await loadPendingInviteToken();
      if (cancelled || !token || resumedRef.current) {
        return;
      }
      resumedRef.current = true;
      router.replace(`/invite/${encodeURIComponent(token)}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, router]);
}
