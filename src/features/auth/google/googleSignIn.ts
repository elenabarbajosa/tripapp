/**
 * Public Google authentication boundary.
 *
 * Must never import `@react-native-google-signin/google-signin`.
 * The native adapter is loaded only via dynamic import after the Expo Go guard.
 */
import Constants from "expo-constants";

import {
  getGoogleConfigMessage,
  isGoogleSignInConfigured,
  isSupabaseConfigured,
} from "@/constants/config";
import { AuthUnavailableError } from "../authErrors";

const EXPO_GO_GOOGLE_MESSAGE =
  "Google sign-in requires a development build. Email sign-in still works in Expo Go.";

function isExpoGoRuntime(): boolean {
  return Constants.expoGoConfig != null;
}

/** Polished unavailable message for Expo Go vs missing credentials. */
export function getGoogleSignInUnavailableMessage(): string {
  if (isExpoGoRuntime()) {
    return EXPO_GO_GOOGLE_MESSAGE;
  }
  return getGoogleConfigMessage();
}

/**
 * Pure availability check — Constants + env only.
 * Never imports, requires, configures, or probes the native Google package.
 */
export function isGoogleNativeSignInAvailable(): boolean {
  if (isExpoGoRuntime()) {
    return false;
  }
  return isSupabaseConfigured() && isGoogleSignInConfigured();
}

/**
 * Google ID-token sign-in entry point.
 * In Expo Go: throws the development-build message without loading native code.
 * Outside Expo Go: dynamically imports googleSignInNative.ts.
 */
export async function signInWithGoogleIdToken(): Promise<void> {
  if (isExpoGoRuntime()) {
    throw new AuthUnavailableError(EXPO_GO_GOOGLE_MESSAGE);
  }

  const { signInWithGoogleIdTokenNative } = await import("./googleSignInNative");
  await signInWithGoogleIdTokenNative();
}
