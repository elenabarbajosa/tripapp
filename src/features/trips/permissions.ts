import type { MemberRole } from "@/types/models";

/**
 * Centralized trip authorization helpers.
 * Screens should use these instead of raw role string comparisons.
 */
export function canViewTrip(role: MemberRole | null | undefined): boolean {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canEditTripContent(role: MemberRole | null | undefined): boolean {
  return role === "owner" || role === "editor";
}

export function canManageTripSettings(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

export function canInviteMembers(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

export function canChangeMemberRoles(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

/** Alias for {@link canChangeMemberRoles}. */
export function canManageMemberRoles(role: MemberRole | null | undefined): boolean {
  return canChangeMemberRoles(role);
}

export function canRemoveMembers(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

/**
 * Whether the acting user may remove a specific member.
 * Owners cannot remove themselves or another owner.
 */
export function canRemoveMember(
  role: MemberRole | null | undefined,
  targetRole: MemberRole,
  isSelf: boolean,
): boolean {
  if (role !== "owner") {
    return false;
  }
  if (isSelf) {
    return false;
  }
  if (targetRole === "owner") {
    return false;
  }
  return true;
}

export function canTransferOwnership(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

/** Non-owners may leave; owners must transfer first. */
export function canLeaveTrip(role: MemberRole | null | undefined): boolean {
  return role === "editor" || role === "viewer";
}

export function canRevokeInvitation(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

export function canDeleteTrip(role: MemberRole | null | undefined): boolean {
  return role === "owner";
}

export function roleLabel(role: MemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
