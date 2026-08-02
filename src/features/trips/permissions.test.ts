import {
  canChangeMemberRoles,
  canCreateActivity,
  canDeleteActivity,
  canDeleteTrip,
  canEditActivity,
  canEditTripContent,
  canInviteMembers,
  canLeaveTrip,
  canManageMemberRoles,
  canManageTripSettings,
  canRemoveMember,
  canRemoveMembers,
  canReorderActivities,
  canRevokeInvitation,
  canTransferOwnership,
  canViewItinerary,
  canViewTrip,
  roleLabel,
} from "@/features/trips/permissions";

describe("trip permissions", () => {
  it("grants view access to all accepted roles", () => {
    expect(canViewTrip("owner")).toBe(true);
    expect(canViewTrip("editor")).toBe(true);
    expect(canViewTrip("viewer")).toBe(true);
    expect(canViewTrip(null)).toBe(false);
  });

  it("limits content editing to owners and editors", () => {
    expect(canEditTripContent("owner")).toBe(true);
    expect(canEditTripContent("editor")).toBe(true);
    expect(canEditTripContent("viewer")).toBe(false);
  });

  it("reserves membership and settings actions for owners", () => {
    expect(canManageTripSettings("owner")).toBe(true);
    expect(canInviteMembers("editor")).toBe(false);
    expect(canChangeMemberRoles("viewer")).toBe(false);
    expect(canManageMemberRoles("owner")).toBe(true);
    expect(canRemoveMembers("owner")).toBe(true);
    expect(canDeleteTrip("editor")).toBe(false);
    expect(canTransferOwnership("owner")).toBe(true);
    expect(canTransferOwnership("editor")).toBe(false);
    expect(canRevokeInvitation("owner")).toBe(true);
    expect(canRevokeInvitation("viewer")).toBe(false);
  });

  it("gates member removal by target and self", () => {
    expect(canRemoveMember("owner", "editor", false)).toBe(true);
    expect(canRemoveMember("owner", "viewer", false)).toBe(true);
    expect(canRemoveMember("owner", "owner", false)).toBe(false);
    expect(canRemoveMember("owner", "editor", true)).toBe(false);
    expect(canRemoveMember("editor", "viewer", false)).toBe(false);
  });

  it("allows non-owners to leave a trip", () => {
    expect(canLeaveTrip("editor")).toBe(true);
    expect(canLeaveTrip("viewer")).toBe(true);
    expect(canLeaveTrip("owner")).toBe(false);
    expect(canLeaveTrip(null)).toBe(false);
  });

  it("formats role labels", () => {
    expect(roleLabel("owner")).toBe("Owner");
    expect(roleLabel("editor")).toBe("Editor");
    expect(roleLabel("viewer")).toBe("Viewer");
  });

  it("grants itinerary view to all accepted roles", () => {
    expect(canViewItinerary("owner")).toBe(true);
    expect(canViewItinerary("editor")).toBe(true);
    expect(canViewItinerary("viewer")).toBe(true);
    expect(canViewItinerary(null)).toBe(false);
  });

  it("limits itinerary mutations to owners and editors", () => {
    expect(canCreateActivity("owner")).toBe(true);
    expect(canCreateActivity("editor")).toBe(true);
    expect(canCreateActivity("viewer")).toBe(false);
    expect(canEditActivity("editor")).toBe(true);
    expect(canEditActivity("viewer")).toBe(false);
    expect(canDeleteActivity("owner")).toBe(true);
    expect(canDeleteActivity("viewer")).toBe(false);
    expect(canReorderActivities("editor")).toBe(true);
    expect(canReorderActivities("viewer")).toBe(false);
    expect(canReorderActivities(null)).toBe(false);
  });
});
