import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_INVITE_TOKEN_KEY = "@tripapp/pending-invite-token";

/** Persist a raw invite token until auth completes. Never log the token. */
export async function savePendingInviteToken(rawToken: string): Promise<void> {
  const token = rawToken.trim();
  if (!token) {
    return;
  }
  await AsyncStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

export async function loadPendingInviteToken(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function clearPendingInviteToken(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}
