import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto";

export interface AuthNoncePair {
  /** Raw nonce passed to Supabase signInWithIdToken. */
  rawNonce: string;
  /** SHA-256 hex digest passed to native providers that expect a hashed nonce. */
  hashedNonce: string;
}

/** Cryptographically secure nonce pair for OpenID Connect ID-token flows. */
export async function createAuthNonce(): Promise<AuthNoncePair> {
  const rawNonce = randomUUID();
  const hashedNonce = await digestStringAsync(CryptoDigestAlgorithm.SHA256, rawNonce);
  return { rawNonce, hashedNonce };
}
