import {
  canChangeMemberRoles,
  canDeleteTrip,
  canEditTripContent,
  canInviteMembers,
  canManageTripSettings,
  canRemoveMembers,
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
    expect(canRemoveMembers("owner")).toBe(true);
    expect(canDeleteTrip("editor")).toBe(false);
  });

  it("formats role labels", () => {
    expect(roleLabel("owner")).toBe("Owner");
    expect(roleLabel("editor")).toBe("Editor");
    expect(roleLabel("viewer")).toBe("Viewer");
  });
});
