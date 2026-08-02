import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";

/**
 * SHA-256 hex digest of a raw invitation token.
 * Mirrors `public.hash_invitation_token` (pgcrypto digest → hex).
 */
export async function hashInvitationToken(raw: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, raw);
}
