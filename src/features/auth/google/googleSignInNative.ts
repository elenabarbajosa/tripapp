/**
 * Native Google Sign-In adapter.
 *
 * This is the ONLY module allowed to import
 * `@react-native-google-signin/google-signin`.
 *
 * Must be loaded exclusively via:
 *   await import("./googleSignInNative")
 * after the Expo Go guard in googleSignIn.ts has already returned.
 */
import { Platform } from "react-native";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { appConfig, getGoogleConfigMessage, isGoogleSignInConfigured } from "@/constants/config";
import { getSupabaseClient, getSupabaseStatusMessage } from "@/services/supabase";
import {
  AuthCancelledError,
  AuthNotConfiguredError,
  AuthUnavailableError,
  logAuthErrorCategory,
} from "../authErrors";
import { fillEmptyProfileFromAuthUser } from "../profileSync";

let googleConfigured = false;

export function resetGoogleNativeConfigurationForTests(): void {
  googleConfigured = false;
}

function ensureGoogleConfigured(): void {
  if (!isGoogleSignInConfigured()) {
    throw new AuthNotConfiguredError(getGoogleConfigMessage());
  }

  if (googleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: appConfig.googleWebClientId,
    ...(appConfig.googleIosClientId ? { iosClientId: appConfig.googleIosClientId } : {}),
    offlineAccess: false,
  });
  googleConfigured = true;
}

/**
 * Performs native Google ID-token sign-in.
 * Requires a development build (never load this module in Expo Go).
 *
 * Native Google ID tokens from this library do not expose a custom nonce API
 * in the free Original module. Enable "Skip nonce check" for the Google
 * provider in the Supabase dashboard when using this flow.
 */
export async function signInWithGoogleIdTokenNative(): Promise<void> {
  if (!getSupabaseClient()) {
    throw new AuthNotConfiguredError(getSupabaseStatusMessage());
  }

  ensureGoogleConfigured();

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new AuthCancelledError();
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new AuthUnavailableError(
        "Google did not return an ID token. Verify EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and rebuild the app.",
      );
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new AuthNotConfiguredError(getSupabaseStatusMessage());
    }

    const { data, error } = await client.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      logAuthErrorCategory("google_id_token", error);
      throw error;
    }

    if (data.user) {
      try {
        await fillEmptyProfileFromAuthUser(client, data.user);
      } catch (profileError) {
        logAuthErrorCategory("google_profile_fill", profileError);
      }
    }
  } catch (error) {
    if (error instanceof AuthCancelledError) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new AuthCancelledError();
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new AuthUnavailableError("Google sign-in is already in progress.");
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new AuthUnavailableError(
          "Google Play Services are unavailable or out of date on this device.",
        );
      }
    }

    throw error;
  }
}
