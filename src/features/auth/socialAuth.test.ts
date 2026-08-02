import {
  AuthCancelledError,
  AuthNotConfiguredError,
  getAuthErrorMessage,
  getSocialAuthErrorMessage,
  isAuthCancelledError,
} from "@/features/auth/authErrors";
import { buildAppleDisplayName, extractProviderDisplayName } from "@/features/auth/profileSync";
import { shouldShowDevPreviewButton } from "@/features/auth/authState";
import {
  getGoogleConfigMessage,
  isGoogleSignInConfigured,
  validatePublicEnv,
} from "@/constants/env";
import { iosUrlSchemeFromClientId } from "@/features/auth/googleConfig";
import type { User } from "@supabase/supabase-js";

describe("google env configuration", () => {
  it("requires web client id for google availability", () => {
    expect(
      isGoogleSignInConfigured({
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
      }),
    ).toBe(false);

    expect(
      isGoogleSignInConfigured({
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "web-client.apps.googleusercontent.com",
      }),
    ).toBe(true);
  });

  it("explains missing google credentials without leaking secrets", () => {
    const message = getGoogleConfigMessage({
      EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
    });
    expect(message).toContain("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
    expect(message).not.toMatch(/eyJ|secret/i);
  });

  it("builds the iOS URL scheme from the iOS client id", () => {
    expect(iosUrlSchemeFromClientId("123-abc.apps.googleusercontent.com")).toBe(
      "com.googleusercontent.apps.123-abc",
    );
    expect(iosUrlSchemeFromClientId("")).toBeUndefined();
  });

  it("still validates supabase public vars independently", () => {
    const result = validatePublicEnv({
      EXPO_PUBLIC_APP_ENV: "development",
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "web-client",
    });
    expect(result.isValid).toBe(false);
    expect(result.values.googleWebClientId).toBe("web-client");
  });
});

describe("social auth error mapping", () => {
  it("treats cancellation as non-failure messaging", () => {
    expect(isAuthCancelledError(new AuthCancelledError())).toBe(true);
    expect(isAuthCancelledError({ code: "ERR_REQUEST_CANCELED" })).toBe(true);
    expect(isAuthCancelledError({ code: "SIGN_IN_CANCELLED" })).toBe(true);
    expect(getSocialAuthErrorMessage("google", new AuthCancelledError())).toBe(
      "Authentication was cancelled.",
    );
  });

  it("maps missing configuration and provider disabled errors", () => {
    expect(
      getAuthErrorMessage(new AuthNotConfiguredError("Google sign-in is not configured yet.")),
    ).toContain("not configured");
    expect(getAuthErrorMessage({ message: "Provider is not enabled" })).toContain(
      "not enabled in Supabase",
    );
    expect(getAuthErrorMessage({ message: "Native module RNGoogleSignin" })).toContain(
      "development build",
    );
  });
});

describe("provider profile metadata", () => {
  it("builds apple display names from the first-login full name payload", () => {
    expect(
      buildAppleDisplayName({
        givenName: "Alex",
        middleName: null,
        familyName: "Rivera",
      }),
    ).toBe("Alex Rivera");
    expect(buildAppleDisplayName(null)).toBeNull();
  });

  it("extracts google-style metadata names", () => {
    const user = {
      id: "user-1",
      user_metadata: {
        full_name: "Jordan Lee",
        avatar_url: "https://example.com/a.png",
      },
    } as unknown as User;

    expect(extractProviderDisplayName(user)).toBe("Jordan Lee");
  });
});

describe("preview mode", () => {
  it("remains development-only", () => {
    expect(shouldShowDevPreviewButton(true)).toBe(true);
    expect(shouldShowDevPreviewButton(false)).toBe(false);
  });
});
