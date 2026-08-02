export type AppEnvironment = "development" | "staging" | "production";

export interface PublicEnv {
  appEnv: AppEnvironment;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  values: PublicEnv;
  /** Human-readable message; never includes secret values. */
  message: string;
}

const REQUIRED_SUPABASE_VARS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function resolveAppEnv(raw: string | undefined): AppEnvironment {
  if (raw === "staging" || raw === "production" || raw === "development") {
    return raw;
  }
  return "development";
}

/**
 * Reads and validates public Expo env vars.
 * Never logs or returns secret-looking values beyond presence checks.
 * Safe to call from tests — missing vars produce a failed result, not a throw.
 */
export function validatePublicEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): EnvValidationResult {
  const supabaseUrl = (env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabasePublishableKey = (env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  const appEnv = resolveAppEnv(env.EXPO_PUBLIC_APP_ENV);

  const missing = REQUIRED_SUPABASE_VARS.filter((key) => {
    const value = (env[key] ?? "").trim();
    return value.length === 0;
  });

  const isValid = missing.length === 0;

  return {
    isValid,
    missing: [...missing],
    values: {
      appEnv,
      supabaseUrl,
      supabasePublishableKey,
    },
    message: isValid
      ? "Public Supabase environment variables are configured."
      : `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and add your Project URL and publishable key.`,
  };
}

export function isDevelopmentEnv(appEnv: AppEnvironment = validatePublicEnv().values.appEnv): boolean {
  return appEnv === "development";
}
