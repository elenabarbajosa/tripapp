import type { ProfileRow } from "@/types/database";
import type { ProfileSummary } from "@/types/models";
import type { TripAppSupabaseClient } from "./client";

export function mapProfileRow(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || row.email?.split("@")[0] || "Traveller",
    email: row.email ?? "",
    avatarUrl: row.avatar_url,
    preferredCurrency: row.preferred_currency,
  };
}

export async function fetchProfileByUserId(
  client: TripAppSupabaseClient,
  userId: string,
): Promise<ProfileSummary | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, email, avatar_url, preferred_currency, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data);
}
