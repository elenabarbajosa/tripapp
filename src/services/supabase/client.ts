import "react-native-url-polyfill/auto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

import { appConfig, isSupabaseConfigured } from "@/constants/config";
import type { Database } from "@/types/database";
import { LargeSecureStore } from "./storage";

export type TripAppSupabaseClient = SupabaseClient<Database>;

let client: TripAppSupabaseClient | null = null;
let appStateSubscription: NativeEventSubscription | null = null;
let appStateListenerRegistered = false;

function handleAppStateChange(status: AppStateStatus): void {
  if (!client) {
    return;
  }

  if (status === "active") {
    void client.auth.startAutoRefresh();
  } else {
    void client.auth.stopAutoRefresh();
  }
}

function ensureAppStateListener(): void {
  if (appStateListenerRegistered) {
    return;
  }

  appStateSubscription = AppState.addEventListener("change", handleAppStateChange);
  appStateListenerRegistered = true;

  if (AppState.currentState === "active" && client) {
    void client.auth.startAutoRefresh();
  }
}

/**
 * Returns the shared Supabase client, or null when public env vars are missing.
 * Never creates a pretend client. Call sites must handle the null case.
 */
export function getSupabaseClient(): TripAppSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient<Database>(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
      auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    ensureAppStateListener();
  }

  return client;
}

/** Test / teardown helper — removes the AppState listener if registered. */
export function stopSupabaseAuthLifecycle(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
  appStateListenerRegistered = false;
}

export function getSupabaseStatusMessage(): string {
  if (isSupabaseConfigured()) {
    return "Supabase client is configured.";
  }
  return "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.";
}

/** @deprecated Prefer getSupabaseClient(); kept for clarity in call sites that expect a throw. */
export function requireSupabaseClient(): TripAppSupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(getSupabaseStatusMessage());
  }
  return supabase;
}
