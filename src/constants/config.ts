import {
  getGoogleConfigMessage,
  isGoogleSignInConfigured,
  validatePublicEnv,
  type AppEnvironment,
} from "./env";

const envResult = validatePublicEnv();

export const appConfig = {
  env: envResult.values.appEnv as AppEnvironment,
  supabaseUrl: envResult.values.supabaseUrl,
  supabasePublishableKey: envResult.values.supabasePublishableKey,
  googleWebClientId: envResult.values.googleWebClientId,
  googleIosClientId: envResult.values.googleIosClientId,
  googleAndroidClientId: envResult.values.googleAndroidClientId,
  invitationBaseUrl: envResult.values.invitationBaseUrl,
  scheme: "tripapp",
  isDevelopment: envResult.values.appEnv === "development",
} as const;

export function isSupabaseConfigured(): boolean {
  return envResult.isValid;
}

export function getSupabaseConfigMessage(): string {
  return envResult.message;
}

export { isGoogleSignInConfigured, getGoogleConfigMessage };
