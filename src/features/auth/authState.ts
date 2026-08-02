import type { Session, User } from "@supabase/supabase-js";

import type { ProfileSummary } from "@/types/models";

export interface AuthStateSnapshot {
  session: Session | null;
  user: User | null;
  profile: ProfileSummary | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
}

export function buildAuthState(input: {
  session: Session | null;
  profile: ProfileSummary | null;
  isInitializing: boolean;
  isProfileLoading: boolean;
}): AuthStateSnapshot {
  const user = input.session?.user ?? null;
  return {
    session: input.session,
    user,
    profile: input.profile,
    isInitializing: input.isInitializing,
    isAuthenticated: Boolean(input.session?.user),
    isProfileLoading: input.isProfileLoading,
  };
}

/** Pure guard helpers for protected navigation (unit-testable). */
export function canAccessProtectedApp(options: {
  isInitializing: boolean;
  isAuthenticated: boolean;
  isPreviewActive: boolean;
}): boolean {
  if (options.isInitializing) {
    return false;
  }
  return options.isAuthenticated || options.isPreviewActive;
}

export function canAccessAuthRoutes(options: {
  isInitializing: boolean;
  isAuthenticated: boolean;
}): boolean {
  if (options.isInitializing) {
    return false;
  }
  return !options.isAuthenticated;
}

export function shouldShowDevPreviewButton(isDevelopment: boolean): boolean {
  return isDevelopment;
}
