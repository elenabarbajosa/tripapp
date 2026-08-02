import {
  canChangeMemberRoles,
  canCreateActivity,
  canCreateBooking,
  canCreatePackingItem,
  canDeleteActivity,
  canDeleteBooking,
  canDeletePackingItem,
  canDeleteTrip,
  canEditActivity,
  canEditBooking,
  canEditPackingItem,
  canEditTripContent,
  canInviteMembers,
  canLeaveTrip,
  canManageExpenses,
  canManageMemberRoles,
  canManageTripSettings,
  canRecordSettlement,
  canRemoveMember,
  canRemoveMembers,
  canReorderActivities,
  canReorderPackingItems,
  canRevokeInvitation,
  canTogglePackingItem,
  canTransferOwnership,
  canViewBookings,
  canViewExpenses,
  canViewItinerary,
  canViewPacking,
  canViewTrip,
  canArchiveIdea,
  canCreateIdea,
  canDeleteIdea,
  canEditIdea,
  canPromoteIdea,
  canViewIdeas,
  canVoteOnIdea,
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

  it("grants booking view to all accepted roles", () => {
    expect(canViewBookings("owner")).toBe(true);
    expect(canViewBookings("editor")).toBe(true);
    expect(canViewBookings("viewer")).toBe(true);
    expect(canViewBookings(null)).toBe(false);
  });

  it("limits booking mutations to owners and editors", () => {
    expect(canCreateBooking("owner")).toBe(true);
    expect(canCreateBooking("editor")).toBe(true);
    expect(canCreateBooking("viewer")).toBe(false);
    expect(canEditBooking("editor")).toBe(true);
    expect(canEditBooking("viewer")).toBe(false);
    expect(canDeleteBooking("owner")).toBe(true);
    expect(canDeleteBooking("viewer")).toBe(false);
    expect(canDeleteBooking(null)).toBe(false);
  });

  it("grants expense view to all accepted roles", () => {
    expect(canViewExpenses("owner")).toBe(true);
    expect(canViewExpenses("editor")).toBe(true);
    expect(canViewExpenses("viewer")).toBe(true);
    expect(canViewExpenses(null)).toBe(false);
  });

  it("limits expense and settlement mutations to owners and editors", () => {
    expect(canManageExpenses("owner")).toBe(true);
    expect(canManageExpenses("editor")).toBe(true);
    expect(canManageExpenses("viewer")).toBe(false);
    expect(canManageExpenses(null)).toBe(false);
    expect(canRecordSettlement("owner")).toBe(true);
    expect(canRecordSettlement("editor")).toBe(true);
    expect(canRecordSettlement("viewer")).toBe(false);
    expect(canRecordSettlement(null)).toBe(false);
  });

  describe("packing permissions", () => {
    const ownerId = "11111111-1111-4111-8111-111111111111";
    const otherId = "22222222-2222-4222-8222-222222222222";

    it("grants packing view to all accepted roles", () => {
      expect(canViewPacking("owner")).toBe(true);
      expect(canViewPacking("editor")).toBe(true);
      expect(canViewPacking("viewer")).toBe(true);
      expect(canViewPacking(null)).toBe(false);
    });

    it("lets owners and editors create any packing item", () => {
      expect(canCreatePackingItem("owner", "shared", null, ownerId)).toBe(true);
      expect(canCreatePackingItem("editor", "personal", otherId, ownerId)).toBe(true);
    });

    it("lets viewers only create a personal item assigned to themselves", () => {
      expect(canCreatePackingItem("viewer", "personal", ownerId, ownerId)).toBe(true);
      expect(canCreatePackingItem("viewer", "personal", otherId, ownerId)).toBe(false);
      expect(canCreatePackingItem("viewer", "shared", null, ownerId)).toBe(false);
      expect(canCreatePackingItem(null, "personal", ownerId, ownerId)).toBe(false);
    });

    it("lets owners and editors edit or delete any packing item", () => {
      const sharedItem = { scope: "shared" as const, assignedTo: null, createdBy: otherId };
      expect(canEditPackingItem("owner", sharedItem, ownerId)).toBe(true);
      expect(canDeletePackingItem("editor", sharedItem, ownerId)).toBe(true);
    });

    it("lets a viewer edit or delete only their own personal item", () => {
      const ownPersonalItem = {
        scope: "personal" as const,
        assignedTo: ownerId,
        createdBy: ownerId,
      };
      const othersPersonalItem = {
        scope: "personal" as const,
        assignedTo: otherId,
        createdBy: otherId,
      };
      const sharedItem = { scope: "shared" as const, assignedTo: null, createdBy: otherId };

      expect(canEditPackingItem("viewer", ownPersonalItem, ownerId)).toBe(true);
      expect(canDeletePackingItem("viewer", ownPersonalItem, ownerId)).toBe(true);
      expect(canEditPackingItem("viewer", othersPersonalItem, ownerId)).toBe(false);
      expect(canEditPackingItem("viewer", sharedItem, ownerId)).toBe(false);
      expect(canEditPackingItem(null, ownPersonalItem, ownerId)).toBe(false);
    });

    it("lets any accepted member toggle a shared item or their own personal item", () => {
      const sharedItem = { scope: "shared" as const, assignedTo: null };
      const ownPersonalItem = { scope: "personal" as const, assignedTo: ownerId };
      const othersPersonalItem = { scope: "personal" as const, assignedTo: otherId };

      expect(canTogglePackingItem("viewer", sharedItem, ownerId)).toBe(true);
      expect(canTogglePackingItem("viewer", ownPersonalItem, ownerId)).toBe(true);
      expect(canTogglePackingItem("viewer", othersPersonalItem, ownerId)).toBe(false);
      expect(canTogglePackingItem("owner", othersPersonalItem, ownerId)).toBe(true);
      expect(canTogglePackingItem(null, sharedItem, ownerId)).toBe(false);
    });

    it("limits packing reorder to owners and editors", () => {
      expect(canReorderPackingItems("owner")).toBe(true);
      expect(canReorderPackingItems("editor")).toBe(true);
      expect(canReorderPackingItems("viewer")).toBe(false);
      expect(canReorderPackingItems(null)).toBe(false);
    });
  });

  describe("ideas permissions", () => {
    const ownerId = "11111111-1111-4111-8111-111111111111";
    const otherId = "22222222-2222-4222-8222-222222222222";
    const proposedOwn = { status: "proposed" as const, createdBy: ownerId };
    const proposedOther = { status: "proposed" as const, createdBy: otherId };
    const archivedOwn = { status: "archived" as const, createdBy: ownerId };

    it("lets any accepted member view, create, and vote", () => {
      expect(canViewIdeas("viewer")).toBe(true);
      expect(canCreateIdea("viewer")).toBe(true);
      expect(canVoteOnIdea("viewer")).toBe(true);
      expect(canViewIdeas(null)).toBe(false);
      expect(canCreateIdea(null)).toBe(false);
      expect(canVoteOnIdea(null)).toBe(false);
    });

    it("lets creators edit or delete their own proposed idea", () => {
      expect(canEditIdea("viewer", proposedOwn, ownerId)).toBe(true);
      expect(canDeleteIdea("viewer", proposedOwn, ownerId)).toBe(true);
      expect(canEditIdea("viewer", proposedOther, ownerId)).toBe(false);
      expect(canEditIdea("viewer", archivedOwn, ownerId)).toBe(false);
    });

    it("lets owners and editors manage any idea and promote", () => {
      expect(canEditIdea("owner", proposedOther, ownerId)).toBe(true);
      expect(canDeleteIdea("editor", proposedOther, ownerId)).toBe(true);
      expect(canArchiveIdea("owner")).toBe(true);
      expect(canArchiveIdea("viewer")).toBe(false);
      expect(canPromoteIdea("editor")).toBe(true);
      expect(canPromoteIdea("viewer")).toBe(false);
      expect(canPromoteIdea(null)).toBe(false);
    });
  });
});
