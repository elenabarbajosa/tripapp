import type { User } from "@supabase/supabase-js";

import type { TripAppSupabaseClient } from "@/services/supabase";
import { fetchProfileByUserId } from "@/services/supabase";

function readMetaString(meta: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function extractProviderDisplayName(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return readMetaString(meta, ["display_name", "full_name", "name"]);
}

export function extractProviderAvatarUrl(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return readMetaString(meta, ["avatar_url", "picture"]);
}

export function buildAppleDisplayName(fullName: {
  givenName: string | null;
  middleName?: string | null;
  familyName: string | null;
} | null): string | null {
  if (!fullName) {
    return null;
  }

  const parts = [fullName.givenName, fullName.middleName, fullName.familyName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * Fills empty profile fields from provider metadata without overwriting
 * a user-customized display name or avatar.
 */
export async function fillEmptyProfileFromAuthUser(
  client: TripAppSupabaseClient,
  user: User,
): Promise<void> {
  const profile = await fetchProfileByUserId(client, user.id);
  if (!profile) {
    return;
  }

  const candidateName = extractProviderDisplayName(user);
  const candidateAvatar = extractProviderAvatarUrl(user);
  const emailLocalPart = user.email?.split("@")[0]?.trim() ?? "";

  const updates: { display_name?: string; avatar_url?: string } = {};

  const hasCustomName =
    Boolean(profile.displayName) &&
    profile.displayName !== "Traveller" &&
    profile.displayName !== emailLocalPart;

  if (!hasCustomName && candidateName) {
    updates.display_name = candidateName;
  }

  if (!profile.avatarUrl && candidateAvatar) {
    updates.avatar_url = candidateAvatar;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error } = await client.from("profiles").update(updates).eq("id", user.id);
  if (error) {
    throw error;
  }
}

/**
 * Persists Apple's first-login name into auth metadata and the profile row
 * only when Apple actually provided a name and the profile is still a fallback.
 */
export async function applyAppleFirstLoginName(
  client: TripAppSupabaseClient,
  user: User,
  displayName: string,
): Promise<void> {
  const { error: metaError } = await client.auth.updateUser({
    data: {
      display_name: displayName,
      full_name: displayName,
    },
  });
  if (metaError) {
    throw metaError;
  }

  await fillEmptyProfileFromAuthUser(client, {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      display_name: displayName,
      full_name: displayName,
    },
  });
}
