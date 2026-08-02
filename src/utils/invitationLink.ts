import { appConfig } from "@/constants/config";

/** Default invitation lifetime (7 days), matching RPC defaults. */
export const DEFAULT_INVITE_EXPIRY_HOURS = 168;

/**
 * Builds a shareable invite URL for a raw token.
 * Prefers `EXPO_PUBLIC_INVITATION_BASE_URL`, otherwise `tripapp://invite/{token}`.
 */
export function buildInvitationLink(rawToken: string): string {
  const token = rawToken.trim();
  const base = appConfig.invitationBaseUrl.replace(/\/$/, "");
  if (base.length > 0) {
    return `${base}/${encodeURIComponent(token)}`;
  }
  return `${appConfig.scheme}://invite/${encodeURIComponent(token)}`;
}
