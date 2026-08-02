import { isSupabaseConfigured } from "@/constants/config";
import { getSupabaseClient, getSupabaseStatusMessage } from "@/services/supabase";

describe("supabase client skeleton", () => {
  it("reports when supabase env vars are missing", () => {
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
    expect(getSupabaseStatusMessage()).toContain("not configured");
  });
});
