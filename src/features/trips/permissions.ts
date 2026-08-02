import type { MemberRole, TripPackingScope } from "@/types/models";

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

/** Any accepted member may view the itinerary. */
export function canViewItinerary(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Alias for {@link canEditTripContent}. */
export function canCreateActivity(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canEditActivity(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canDeleteActivity(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canReorderActivities(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Any accepted member may view bookings. */
export function canViewBookings(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Alias for {@link canEditTripContent}. */
export function canCreateBooking(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canEditBooking(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canDeleteBooking(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Any accepted member may view expenses and balances. */
export function canViewExpenses(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Alias for {@link canEditTripContent}. */
export function canManageExpenses(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Alias for {@link canEditTripContent}. */
export function canRecordSettlement(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Any accepted member may view the packing list. */
export function canViewPacking(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/**
 * Owners and editors may create any packing item. Viewers may only create a
 * personal item assigned to themselves (mirrors the trip_packing_insert RLS policy).
 */
export function canCreatePackingItem(
  role: MemberRole | null | undefined,
  scope: TripPackingScope,
  assignedTo: string | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (canEditTripContent(role)) {
    return true;
  }
  if (!canViewTrip(role) || !userId) {
    return false;
  }
  return scope === "personal" && assignedTo === userId;
}

/** Minimal packing item shape needed to evaluate nuanced edit/delete/toggle rules. */
export interface PackingItemAccess {
  scope: TripPackingScope;
  assignedTo: string | null;
  createdBy: string;
}

/**
 * Owners and editors may edit any packing item. Otherwise, only the creator of
 * their own personal item (assigned to themselves) may edit it
 * (mirrors the trip_packing_update RLS policy).
 */
export function canEditPackingItem(
  role: MemberRole | null | undefined,
  item: PackingItemAccess,
  userId: string | null | undefined,
): boolean {
  if (canEditTripContent(role)) {
    return true;
  }
  if (!canViewTrip(role) || !userId) {
    return false;
  }
  return item.scope === "personal" && item.assignedTo === userId && item.createdBy === userId;
}

/** Same nuanced rule as {@link canEditPackingItem} (mirrors trip_packing_delete RLS policy). */
export function canDeletePackingItem(
  role: MemberRole | null | undefined,
  item: PackingItemAccess,
  userId: string | null | undefined,
): boolean {
  return canEditPackingItem(role, item, userId);
}

/**
 * Owners and editors may toggle any packing item. Any accepted member may
 * toggle a shared item, or a personal item assigned to them
 * (mirrors the toggle_trip_packing_item RPC rule).
 */
export function canTogglePackingItem(
  role: MemberRole | null | undefined,
  item: Pick<PackingItemAccess, "scope" | "assignedTo">,
  userId: string | null | undefined,
): boolean {
  if (canEditTripContent(role)) {
    return true;
  }
  if (!canViewTrip(role)) {
    return false;
  }
  return item.scope === "shared" || item.assignedTo === userId;
}

/** Only owners and editors may reorder packing items (mirrors the reorder_trip_packing_items RPC rule). */
export function canReorderPackingItems(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Any accepted member may view trip ideas. */
export function canViewIdeas(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Any accepted member may propose an idea (mirrors the trip_ideas_insert_member RLS policy). */
export function canCreateIdea(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Any accepted member may vote (mirrors the trip_idea_votes_insert/_delete RLS policies). */
export function canVoteOnIdea(role: MemberRole | null | undefined): boolean {
  return canViewTrip(role);
}

/** Minimal idea shape needed to evaluate nuanced edit/delete rules. */
export interface IdeaAccess {
  status: "proposed" | "added_to_itinerary" | "archived";
  createdBy: string;
}

/**
 * Owners and editors may edit any idea. The creator may edit their own idea
 * only while it is still `proposed` (mirrors the trip_ideas_update RLS policy).
 */
export function canEditIdea(
  role: MemberRole | null | undefined,
  idea: IdeaAccess,
  userId: string | null | undefined,
): boolean {
  if (canEditTripContent(role)) {
    return true;
  }
  if (!canViewTrip(role) || !userId) {
    return false;
  }
  return idea.createdBy === userId && idea.status === "proposed";
}

/** Same nuanced rule as {@link canEditIdea} (mirrors the trip_ideas_delete RLS policy). */
export function canDeleteIdea(
  role: MemberRole | null | undefined,
  idea: IdeaAccess,
  userId: string | null | undefined,
): boolean {
  return canEditIdea(role, idea, userId);
}

/**
 * Only owners and editors may archive an idea: changing `status` away from
 * `proposed` requires `can_edit_trip` under the trip_ideas_update RLS policy.
 */
export function canArchiveIdea(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
}

/** Only owners and editors may promote an idea (mirrors promote_trip_idea_to_activity). */
export function canPromoteIdea(role: MemberRole | null | undefined): boolean {
  return canEditTripContent(role);
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
