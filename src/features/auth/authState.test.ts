import {
  buildAuthState,
  canAccessAuthRoutes,
  canAccessProtectedApp,
  shouldShowDevPreviewButton,
} from "@/features/auth/authState";
import { getAuthErrorMessage } from "@/features/auth/authErrors";
import { mapProfileRow } from "@/services/supabase/profiles";
import type { ProfileRow } from "@/types/database";

describe("auth state helpers", () => {
  it("builds authenticated state from a session", () => {
    const snapshot = buildAuthState({
      session: {
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: { id: "user-1", email: "alex@example.com" } as never,
      },
      profile: null,
      isInitializing: false,
      isProfileLoading: true,
    });

    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.user?.id).toBe("user-1");
    expect(snapshot.isProfileLoading).toBe(true);
  });

  it("allows protected app access for auth or preview only after init", () => {
    expect(
      canAccessProtectedApp({
        isInitializing: true,
        isAuthenticated: true,
        isPreviewActive: false,
      }),
    ).toBe(false);

    expect(
      canAccessProtectedApp({
        isInitializing: false,
        isAuthenticated: true,
        isPreviewActive: false,
      }),
    ).toBe(true);

    expect(
      canAccessProtectedApp({
        isInitializing: false,
        isAuthenticated: false,
        isPreviewActive: true,
      }),
    ).toBe(true);

    expect(
      canAccessProtectedApp({
        isInitializing: false,
        isAuthenticated: false,
        isPreviewActive: false,
      }),
    ).toBe(false);
  });

  it("blocks auth routes for authenticated users after init", () => {
    expect(
      canAccessAuthRoutes({
        isInitializing: false,
        isAuthenticated: true,
      }),
    ).toBe(false);

    expect(
      canAccessAuthRoutes({
        isInitializing: false,
        isAuthenticated: false,
      }),
    ).toBe(true);
  });

  it("shows preview only in development", () => {
    expect(shouldShowDevPreviewButton(true)).toBe(true);
    expect(shouldShowDevPreviewButton(false)).toBe(false);
  });
});

describe("auth error mapping", () => {
  it("maps common supabase auth failures to readable copy", () => {
    expect(getAuthErrorMessage({ message: "Invalid login credentials" })).toBe(
      "Incorrect email or password.",
    );
    expect(getAuthErrorMessage({ message: "Email not confirmed" })).toContain("Confirm your email");
    expect(getAuthErrorMessage({ message: "Failed to fetch" })).toContain("Network error");
  });
});

describe("profile mapping", () => {
  it("maps database rows to profile summaries", () => {
    const row: ProfileRow = {
      id: "user-1",
      display_name: "Alex Rivera",
      email: "alex@example.com",
      avatar_url: null,
      preferred_currency: "EUR",
      created_at: "2026-08-02T00:00:00Z",
      updated_at: "2026-08-02T00:00:00Z",
    };

    expect(mapProfileRow(row)).toEqual({
      id: "user-1",
      displayName: "Alex Rivera",
      email: "alex@example.com",
      avatarUrl: null,
      preferredCurrency: "EUR",
    });
  });

  it("falls back to email local-part when display name is empty", () => {
    const row: ProfileRow = {
      id: "user-2",
      display_name: "  ",
      email: "jordan@example.com",
      avatar_url: null,
      preferred_currency: "USD",
      created_at: "2026-08-02T00:00:00Z",
      updated_at: "2026-08-02T00:00:00Z",
    };

    expect(mapProfileRow(row).displayName).toBe("jordan");
  });
});
