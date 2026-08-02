import type { TripInvitationStatus, TripMemberRole } from "@/types/database";
import type {
  CreatedInvitation,
  InvitationPreview,
  InvitationStatus,
  MemberRole,
  PendingInvitation,
  TripInvitation,
} from "@/types/models";
import { buildInvitationLink } from "@/utils/invitationLink";

export type CreatedInvitationRpcRow = {
  invitation_id: string;
  raw_token: string;
  expires_at: string;
};

export type InvitationPreviewRpcRow = {
  invitation_id: string;
  trip_id: string;
  trip_name: string;
  destination_summary: string | null;
  inviter_display_name: string;
  intended_role: TripMemberRole;
  status: TripInvitationStatus;
  expires_at: string;
  is_expired: boolean;
  is_usable: boolean;
  already_member: boolean;
  requires_email_match: boolean;
  email_matches: boolean | null;
};

export type PendingInvitationRpcRow = {
  invitation_id: string;
  trip_id: string;
  trip_name: string;
  destination_summary: string | null;
  inviter_display_name: string;
  intended_role: TripMemberRole;
  expires_at: string;
  created_at: string;
  invited_email: string | null;
};

export type TripInvitationListRow = {
  id: string;
  trip_id: string;
  invited_email: string | null;
  intended_role: TripMemberRole;
  status: TripInvitationStatus;
  expires_at: string;
  created_at: string;
  trips:
    | {
        name: string;
        trip_destinations:
          | {
              city: string;
              country: string;
              display_order: number;
            }[]
          | null;
      }
    | null;
  inviter:
    | {
        display_name: string | null;
      }
    | null;
};

function asInviteRole(role: TripMemberRole): Exclude<MemberRole, "owner"> {
  if (role === "editor" || role === "viewer") {
    return role;
  }
  // Defensive: DB constraint forbids owner on invitations.
  return "viewer";
}

function asInvitationStatus(status: TripInvitationStatus): InvitationStatus {
  return status;
}

export function mapCreatedInvitation(row: CreatedInvitationRpcRow): CreatedInvitation {
  return {
    invitationId: row.invitation_id,
    rawToken: row.raw_token,
    expiresAt: row.expires_at,
    inviteLink: buildInvitationLink(row.raw_token),
  };
}

export function mapInvitationPreview(row: InvitationPreviewRpcRow): InvitationPreview {
  return {
    invitationId: row.invitation_id,
    tripId: row.trip_id,
    tripName: row.trip_name,
    destinationSummary: row.destination_summary?.trim() || "",
    inviterDisplayName: row.inviter_display_name?.trim() || "Traveller",
    intendedRole: asInviteRole(row.intended_role),
    status: asInvitationStatus(row.status),
    expiresAt: row.expires_at,
    isExpired: row.is_expired,
    isUsable: row.is_usable,
    alreadyMember: row.already_member,
    requiresEmailMatch: row.requires_email_match,
    emailMatches: row.email_matches,
  };
}

export function mapPendingInvitation(row: PendingInvitationRpcRow): PendingInvitation {
  return {
    id: row.invitation_id,
    tripId: row.trip_id,
    tripName: row.trip_name,
    destinationSummary: row.destination_summary?.trim() || "",
    inviterDisplayName: row.inviter_display_name?.trim() || "Traveller",
    intendedRole: asInviteRole(row.intended_role),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    invitedEmail: row.invited_email,
  };
}

function destinationSummaryFromTrip(
  destinations:
    | {
        city: string;
        country: string;
        display_order: number;
      }[]
    | null
    | undefined,
): string {
  if (!destinations || destinations.length === 0) {
    return "";
  }
  return [...destinations]
    .sort((a, b) => a.display_order - b.display_order)
    .map((d) => `${d.city}, ${d.country}`)
    .join(" · ");
}

export function mapTripInvitationRow(row: TripInvitationListRow): TripInvitation {
  const inviterName = row.inviter?.display_name?.trim() || "Traveller";
  return {
    id: row.id,
    tripId: row.trip_id,
    tripName: row.trips?.name ?? "Trip",
    inviterName,
    invitedEmail: row.invited_email,
    intendedRole: asInviteRole(row.intended_role),
    destinationSummary: destinationSummaryFromTrip(row.trips?.trip_destinations),
    expiresAt: row.expires_at,
    status: asInvitationStatus(row.status),
    createdAt: row.created_at,
  };
}

/** Pending home cards can reuse TripInvitation shape when needed. */
export function pendingToTripInvitation(pending: PendingInvitation): TripInvitation {
  return {
    id: pending.id,
    tripId: pending.tripId,
    tripName: pending.tripName,
    inviterName: pending.inviterDisplayName,
    invitedEmail: pending.invitedEmail,
    intendedRole: pending.intendedRole,
    destinationSummary: pending.destinationSummary,
    expiresAt: pending.expiresAt,
    status: "pending",
    createdAt: pending.createdAt,
  };
}
