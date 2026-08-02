import { requireSupabaseClient } from "@/services/supabase";
import type {
  CreatedInvitation,
  InvitationPreview,
  MemberRole,
  PendingInvitation,
  TripInvitation,
} from "@/types/models";
import { isValidEmail, normalizeEmail } from "@/utils/email";
import { DEFAULT_INVITE_EXPIRY_HOURS } from "@/utils/invitationLink";
import { mapInvitationError } from "./errors";
import {
  mapCreatedInvitation,
  mapInvitationPreview,
  mapPendingInvitation,
  mapTripInvitationRow,
  type CreatedInvitationRpcRow,
  type InvitationPreviewRpcRow,
  type PendingInvitationRpcRow,
  type TripInvitationListRow,
} from "./mappers";

export type InviteRole = Exclude<MemberRole, "owner">;

export interface CreateEmailInvitationInput {
  tripId: string;
  email: string;
  role: InviteRole;
  expiresInHours?: number;
}

export interface CreateShareInvitationInput {
  tripId: string;
  role: InviteRole;
  expiresInHours?: number;
}

export interface UpdateMemberRoleInput {
  tripId: string;
  memberUserId: string;
  role: InviteRole;
}

export interface RemoveMemberInput {
  tripId: string;
  memberUserId: string;
}

export interface TransferOwnershipInput {
  tripId: string;
  newOwnerUserId: string;
}

export interface SendInvitationEmailInput {
  invitationId: string;
  email: string;
  inviteLink: string;
  tripName?: string;
  inviterDisplayName?: string;
  intendedRole?: InviteRole;
  expiresAt?: string;
}

export interface SendInvitationEmailResult {
  sent: boolean;
  reason?: string;
}

const TRIP_INVITATION_SELECT = `
  id,
  trip_id,
  invited_email,
  intended_role,
  status,
  expires_at,
  created_at,
  trips (
    name,
    trip_destinations (
      city,
      country,
      display_order
    )
  ),
  inviter:profiles!trip_invitations_invited_by_fkey (
    display_name
  )
`;

function firstRpcRow<T>(data: T[] | T | null, label: string): T {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error(`${label} returned no rows.`);
    }
    return data[0]!;
  }
  if (data == null) {
    throw new Error(`${label} returned no rows.`);
  }
  return data;
}

export async function createEmailInvitation(
  input: CreateEmailInvitationInput,
): Promise<CreatedInvitation> {
  const email = normalizeEmail(input.email);
  if (!email || !isValidEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("create_trip_invitation", {
    p_trip_id: input.tripId,
    p_email: email,
    p_role: input.role,
    p_expires_in_hours: input.expiresInHours ?? DEFAULT_INVITE_EXPIRY_HOURS,
  });

  if (error) {
    throw error;
  }

  return mapCreatedInvitation(firstRpcRow(data as CreatedInvitationRpcRow[] | null, "create_trip_invitation"));
}

export async function createShareInvitation(
  input: CreateShareInvitationInput,
): Promise<CreatedInvitation> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("create_trip_share_link", {
    p_trip_id: input.tripId,
    p_role: input.role,
    p_expires_in_hours: input.expiresInHours ?? DEFAULT_INVITE_EXPIRY_HOURS,
  });

  if (error) {
    throw error;
  }

  return mapCreatedInvitation(firstRpcRow(data as CreatedInvitationRpcRow[] | null, "create_trip_share_link"));
}

export async function getInvitationPreview(rawToken: string): Promise<InvitationPreview> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("get_trip_invitation_preview", {
    p_raw_token: rawToken.trim(),
  });

  if (error) {
    throw error;
  }

  return mapInvitationPreview(
    firstRpcRow(data as InvitationPreviewRpcRow[] | null, "get_trip_invitation_preview"),
  );
}

export async function getMyPendingInvitations(): Promise<PendingInvitation[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("list_my_pending_invitations");

  if (error) {
    throw error;
  }

  return ((data ?? []) as PendingInvitationRpcRow[]).map(mapPendingInvitation);
}

export async function getTripInvitations(tripId: string): Promise<TripInvitation[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("trip_invitations")
    .select(TRIP_INVITATION_SELECT)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as TripInvitationListRow[]).map(mapTripInvitationRow);
}

export async function acceptInvitation(rawToken: string): Promise<string> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("accept_trip_invitation", {
    p_raw_token: rawToken.trim(),
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Invitation was accepted but no trip id was returned.");
  }

  return data;
}

export async function acceptInvitationById(invitationId: string): Promise<string> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("accept_trip_invitation_by_id", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Invitation was accepted but no trip id was returned.");
  }

  return data;
}

export async function declineInvitation(rawToken: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("decline_trip_invitation", {
    p_raw_token: rawToken.trim(),
  });

  if (error) {
    throw error;
  }
}

export async function declineInvitationById(invitationId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("decline_trip_invitation_by_id", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw error;
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("revoke_trip_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw error;
  }
}

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("update_trip_member_role", {
    p_trip_id: input.tripId,
    p_member_user_id: input.memberUserId,
    p_role: input.role,
  });

  if (error) {
    throw error;
  }
}

export async function removeMember(input: RemoveMemberInput): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("remove_trip_member", {
    p_trip_id: input.tripId,
    p_member_user_id: input.memberUserId,
  });

  if (error) {
    throw error;
  }
}

export async function leaveTrip(tripId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("leave_trip", {
    p_trip_id: tripId,
  });

  if (error) {
    throw error;
  }
}

export async function transferOwnership(input: TransferOwnershipInput): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.rpc("transfer_trip_ownership", {
    p_trip_id: input.tripId,
    p_new_owner_user_id: input.newOwnerUserId,
  });

  if (error) {
    throw error;
  }
}

/**
 * Best-effort email delivery via Edge Function.
 * Failures never undo invitation creation — callers should ignore `sent: false`.
 */
export async function sendInvitationEmail(
  input: SendInvitationEmailInput,
): Promise<SendInvitationEmailResult> {
  try {
    const client = requireSupabaseClient();
    const email = normalizeEmail(input.email);
    if (!email || !isValidEmail(email)) {
      return { sent: false, reason: "Enter a valid email address." };
    }

    const { error } = await client.functions.invoke("send-invitation-email", {
      body: {
        invitation_id: input.invitationId,
        email,
        invite_link: input.inviteLink,
        trip_name: input.tripName,
        inviter_display_name: input.inviterDisplayName,
        intended_role: input.intendedRole,
        expires_at: input.expiresAt,
      },
    });

    if (error) {
      return { sent: false, reason: mapInvitationError(error) };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: mapInvitationError(error) };
  }
}
