import { isSupabaseConfigured } from "@/constants/config";
import { getSupabaseClient, getSupabaseStatusMessage } from "@/services/supabase";

describe("supabase client", () => {
  it("does not pretend to connect when env configuration is missing", () => {
    // Module config is evaluated at import time from process.env.
    // In the default test environment, credentials are unset.
    if (!isSupabaseConfigured()) {
      expect(getSupabaseClient()).toBeNull();
      expect(getSupabaseStatusMessage()).toContain("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    } else {
      expect(getSupabaseClient()).not.toBeNull();
    }
  });
});
