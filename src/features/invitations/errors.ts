/**
 * Maps invitation / membership Postgres exceptions to readable copy.
 * Never returns raw tokens or stack traces.
 */
export function mapInvitationError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong with this invitation. Please try again.";
  }

  const message =
    "message" in error && typeof error.message === "string" ? error.message : "";

  // Strip common PostgREST prefixes without exposing internals.
  const normalized = message
    .replace(/^.*ERROR:\s*/i, "")
    .replace(/\s+CONTEXT:[\s\S]*$/i, "")
    .trim();

  const lower = normalized.toLowerCase();

  if (lower.includes("not authenticated")) {
    return "Sign in to continue with this invitation.";
  }
  if (lower.includes("already a member")) {
    return "That person is already a member of this trip.";
  }
  if (lower.includes("active invitation already exists")) {
    return "An active invitation already exists for that email.";
  }
  if (lower.includes("has expired") || lower.includes("invitation has expired")) {
    return "This invitation has expired.";
  }
  if (lower.includes("has been revoked") || lower.includes("invitation has been revoked") || lower.includes("was revoked")) {
    return "This invitation has been revoked.";
  }
  if (lower.includes("was declined") || lower.includes("invitation was declined")) {
    return "This invitation was declined.";
  }
  if (lower.includes("already been accepted")) {
    return "This invitation has already been accepted.";
  }
  if (
    lower.includes("different email address") ||
    lower.includes("invited email address") ||
    lower.includes("sign in with the invited email")
  ) {
    return "This invitation was sent to a different email address.";
  }
  if (lower.includes("invitation not found")) {
    return "Invitation not found.";
  }
  if (lower.includes("invitation token is required")) {
    return "Invitation link is missing or incomplete.";
  }
  if (lower.includes("invitation is not available")) {
    return "This invitation is no longer available.";
  }
  if (lower.includes("only pending invitations can be declined")) {
    return "Only pending invitations can be declined.";
  }
  if (lower.includes("only pending invitations can be revoked")) {
    return "Only pending invitations can be revoked.";
  }
  if (lower.includes("only the trip owner can revoke")) {
    return "Only the trip owner can revoke invitations.";
  }
  if (lower.includes("only the trip owner can create invitations")) {
    return "Only the trip owner can create invitations.";
  }
  if (lower.includes("only the trip owner can create share links")) {
    return "Only the trip owner can create share links.";
  }
  if (lower.includes("only the trip owner can change member roles")) {
    return "Only the trip owner can change member roles.";
  }
  if (lower.includes("only the trip owner can remove members")) {
    return "Only the trip owner can remove members.";
  }
  if (lower.includes("only the current owner can transfer")) {
    return "Only the current owner can transfer ownership.";
  }
  if (
    lower.includes("owner cannot leave") ||
    lower.includes("transferring ownership first") ||
    lower.includes("transfer ownership first")
  ) {
    return "Transfer ownership before leaving this trip.";
  }
  if (lower.includes("owner cannot remove themselves")) {
    return "Transfer ownership before removing yourself from this trip.";
  }
  if (lower.includes("cannot remove the trip owner")) {
    return "The trip owner cannot be removed.";
  }
  if (lower.includes("cannot change the owner role")) {
    return "Use transfer ownership to change the owner.";
  }
  if (lower.includes("use transfer ownership to change the owner")) {
    return "Use transfer ownership to change the owner.";
  }
  if (lower.includes("you are not a member")) {
    return "You are not a member of this trip.";
  }
  if (lower.includes("member not found")) {
    return "Member not found.";
  }
  if (lower.includes("choose a different accepted member")) {
    return "Choose a different accepted member as the new owner.";
  }
  if (lower.includes("new owner must already be an accepted")) {
    return "The new owner must already be an accepted trip member.";
  }
  if (lower.includes("share-link invitations must be accepted via token")) {
    return "Open the share link to accept this invitation.";
  }
  if (lower.includes("share-link invitations must be declined via token")) {
    return "Open the share link to decline this invitation.";
  }
  if (lower.includes("valid invitation email")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("invitation role must be") || lower.includes("share link role must be")) {
    return "Invitation role must be editor or viewer.";
  }
  if (lower.includes("role must be editor or viewer")) {
    return "Role must be editor or viewer.";
  }
  if (lower.includes("expiration must be at least")) {
    return "Expiration must be at least 1 hour.";
  }
  if (lower.includes("ownership transfer failed")) {
    return "Ownership transfer failed. Please try again.";
  }

  // Avoid leaking token-like substrings from unexpected server messages.
  if (
    /token[\s:=]+[a-z0-9_-]{12,}/i.test(normalized) ||
    /(?:token|hash)=?[a-f0-9]{16,}/i.test(normalized)
  ) {
    return "Something went wrong with this invitation. Please try again.";
  }

  if (normalized.length > 0 && normalized.length < 180) {
    return normalized;
  }

  return "Something went wrong with this invitation. Please try again.";
}
