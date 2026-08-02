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

export function canRemoveMembers(role: MemberRole | null | undefined): boolean {
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
