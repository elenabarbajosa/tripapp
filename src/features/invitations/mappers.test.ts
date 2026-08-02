import { mapInvitationError } from "@/features/invitations/errors";
import {
  mapCreatedInvitation,
  mapInvitationPreview,
  mapPendingInvitation,
  mapTripInvitationRow,
  pendingToTripInvitation,
} from "@/features/invitations/mappers";

describe("invitation errors", () => {
  it("maps known invitation failures to readable copy", () => {
    expect(mapInvitationError({ message: "This invitation has expired" })).toMatch(/expired/i);
    expect(mapInvitationError({ message: "This invitation has been revoked" })).toMatch(/revoked/i);
    expect(
      mapInvitationError({
        message: "This invitation was sent to a different email address",
      }),
    ).toMatch(/email/i);
    expect(mapInvitationError({ message: "already a member of this trip" })).toMatch(/member/i);
    expect(
      mapInvitationError({ message: "Owner cannot leave without transferring ownership first" }),
    ).toMatch(/transfer/i);
    expect(mapInvitationError({ message: "Cannot remove the trip owner" })).toMatch(/owner/i);
    expect(mapInvitationError({ message: "An active invitation already exists for that email" })).toMatch(
      /already exists/i,
    );
  });

  it("never echoes raw tokens", () => {
    const message = mapInvitationError({
      message: "bad token=secrettokenvalue1234567890abcdef",
    });
    expect(message.toLowerCase()).not.toContain("secrettokenvalue");
  });
});

describe("invitation mappers", () => {
  it("maps pending invitation RPC rows", () => {
    const mapped = mapPendingInvitation({
      invitation_id: "inv-1",
      trip_id: "trip-1",
      trip_name: "Midwest",
      destination_summary: "Chicago, Milwaukee",
      inviter_display_name: "Alex",
      intended_role: "editor",
      expires_at: "2026-09-01T00:00:00Z",
      created_at: "2026-08-01T00:00:00Z",
      invited_email: "jordan@example.com",
    });

    expect(mapped).toEqual({
      id: "inv-1",
      tripId: "trip-1",
      tripName: "Midwest",
      destinationSummary: "Chicago, Milwaukee",
      inviterDisplayName: "Alex",
      intendedRole: "editor",
      expiresAt: "2026-09-01T00:00:00Z",
      createdAt: "2026-08-01T00:00:00Z",
      invitedEmail: "jordan@example.com",
    });
  });

  it("maps invitation preview for pending/accepted/expired states", () => {
    const pending = mapInvitationPreview({
      invitation_id: "inv-2",
      trip_id: "trip-2",
      trip_name: "Denver",
      destination_summary: "Denver",
      inviter_display_name: "Sam",
      intended_role: "viewer",
      status: "pending",
      expires_at: "2026-09-01T00:00:00Z",
      is_expired: false,
      is_usable: true,
      already_member: false,
      requires_email_match: true,
      email_matches: true,
    });
    expect(pending.isUsable).toBe(true);
    expect(pending.status).toBe("pending");

    const expired = mapInvitationPreview({
      ...pending,
      invitation_id: "inv-2b",
      trip_id: "trip-2",
      trip_name: "Denver",
      destination_summary: "Denver",
      inviter_display_name: "Sam",
      intended_role: "viewer",
      status: "expired",
      expires_at: "2026-08-01T00:00:00Z",
      is_expired: true,
      is_usable: false,
      already_member: false,
      requires_email_match: false,
      email_matches: null,
    });
    expect(expired.isExpired).toBe(true);
    expect(expired.isUsable).toBe(false);

    const member = mapInvitationPreview({
      invitation_id: "inv-2c",
      trip_id: "trip-2",
      trip_name: "Denver",
      destination_summary: "Denver",
      inviter_display_name: "Sam",
      intended_role: "editor",
      status: "accepted",
      expires_at: "2026-09-01T00:00:00Z",
      is_expired: false,
      is_usable: false,
      already_member: true,
      requires_email_match: false,
      email_matches: true,
    });
    expect(member.alreadyMember).toBe(true);
  });

  it("maps created invitation with link", () => {
    const created = mapCreatedInvitation({
      invitation_id: "inv-3",
      raw_token: "raw-token-value",
      expires_at: "2026-09-01T00:00:00Z",
    });
    expect(created.invitationId).toBe("inv-3");
    expect(created.rawToken).toBe("raw-token-value");
    expect(created.inviteLink).toContain("raw-token-value");
  });

  it("maps trip invitation table rows for owner lists", () => {
    const mapped = mapTripInvitationRow({
      id: "inv-4",
      trip_id: "trip-4",
      invited_email: "a@b.com",
      intended_role: "viewer",
      status: "pending",
      expires_at: "2026-09-01T00:00:00Z",
      created_at: "2026-08-01T00:00:00Z",
      trips: {
        name: "Road Trip",
        trip_destinations: [
          { city: "Chicago", country: "United States", display_order: 1 },
        ],
      },
      inviter: { display_name: "Alex" },
    });

    expect(mapped.status).toBe("pending");
    expect(mapped.tripName).toBe("Road Trip");
    expect(mapped.inviterName).toBe("Alex");
    expect(mapped.destinationSummary).toContain("Chicago");
  });

  it("converts pending invitations for Home cards", () => {
    const card = pendingToTripInvitation({
      id: "inv-5",
      tripId: "trip-5",
      tripName: "Ski",
      destinationSummary: "Denver",
      inviterDisplayName: "Morgan",
      intendedRole: "editor",
      expiresAt: "2026-09-01T00:00:00Z",
      createdAt: "2026-08-01T00:00:00Z",
      invitedEmail: "you@example.com",
    });
    expect(card.status).toBe("pending");
    expect(card.inviterName).toBe("Morgan");
  });
});
