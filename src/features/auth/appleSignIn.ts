import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { getSupabaseClient, getSupabaseStatusMessage } from "@/services/supabase";
import {
  AuthCancelledError,
  AuthNotConfiguredError,
  AuthUnavailableError,
  logAuthErrorCategory,
} from "./authErrors";
import { createAuthNonce } from "./nonce";
import { applyAppleFirstLoginName, buildAppleDisplayName } from "./profileSync";

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") {
    return false;
  }

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Native Apple ID-token sign-in via expo-apple-authentication.
 * iOS only. Works in Expo Go for smoke testing; production needs the Apple capability.
 */
export async function signInWithAppleIdToken(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new AuthUnavailableError("Apple sign-in is only available on iOS.");
  }

  const available = await isAppleSignInAvailable();
  if (!available) {
    throw new AuthUnavailableError(
      "Apple sign-in is unavailable on this device. Configure Sign in with Apple in your Apple Developer account and rebuild when ready.",
    );
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new AuthNotConfiguredError(getSupabaseStatusMessage());
  }

  try {
    const { rawNonce, hashedNonce } = await createAuthNonce();

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new AuthUnavailableError(
        "Apple did not return an identity token. Confirm Sign in with Apple is enabled for this app.",
      );
    }

    const { data, error } = await client.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      logAuthErrorCategory("apple_id_token", error);
      throw error;
    }

    const displayName = buildAppleDisplayName(credential.fullName);
    if (displayName && data.user) {
      try {
        await applyAppleFirstLoginName(client, data.user, displayName);
      } catch (profileError) {
        logAuthErrorCategory("apple_profile_name", profileError);
      }
    }
  } catch (error) {
    if (error instanceof AuthCancelledError) {
      throw error;
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      String(error.code) === "ERR_REQUEST_CANCELED"
    ) {
      throw new AuthCancelledError();
    }

    throw error;
  }
}
