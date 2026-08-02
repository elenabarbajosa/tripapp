import { validatePublicEnv, isDevelopmentEnv } from "@/constants/env";

describe("validatePublicEnv", () => {
  it("reports missing supabase public variables without throwing", () => {
    const result = validatePublicEnv({
      EXPO_PUBLIC_APP_ENV: "development",
    });

    expect(result.isValid).toBe(false);
    expect(result.missing).toEqual([
      "EXPO_PUBLIC_SUPABASE_URL",
      "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ]);
    expect(result.message).toContain("Missing required environment variables");
    expect(result.message).not.toMatch(/eyJ|service_role|secret/i);
  });

  it("accepts a complete public configuration", () => {
    const result = validatePublicEnv({
      EXPO_PUBLIC_APP_ENV: "staging",
      EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    });

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.values.appEnv).toBe("staging");
    expect(result.values.supabaseUrl).toBe("https://example.supabase.co");
  });

  it("defaults unknown app env values to development", () => {
    const result = validatePublicEnv({
      EXPO_PUBLIC_APP_ENV: "local",
      EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    });

    expect(result.values.appEnv).toBe("development");
    expect(isDevelopmentEnv(result.values.appEnv)).toBe(true);
  });
});
