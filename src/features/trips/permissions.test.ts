import {
  canChangeMemberRoles,
  canDeleteTrip,
  canEditTripContent,
  canInviteMembers,
  canLeaveTrip,
  canManageMemberRoles,
  canManageTripSettings,
  canRemoveMember,
  canRemoveMembers,
  canRevokeInvitation,
  canTransferOwnership,
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
});
