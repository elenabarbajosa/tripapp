import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tripKeys } from "@/features/trips/hooks";
import {
  acceptInvitation,
  acceptInvitationById,
  createEmailInvitation,
  createShareInvitation,
  declineInvitation,
  declineInvitationById,
  getInvitationPreview,
  getMyPendingInvitations,
  getTripInvitations,
  leaveTrip,
  removeMember,
  revokeInvitation,
  sendInvitationEmail,
  transferOwnership,
  updateMemberRole,
  type CreateEmailInvitationInput,
  type CreateShareInvitationInput,
  type RemoveMemberInput,
  type TransferOwnershipInput,
  type UpdateMemberRoleInput,
} from "./api";

export const invitationKeys = {
  all: ["invitations"] as const,
  mine: () => [...invitationKeys.all, "mine"] as const,
  trip: (tripId: string) => [...invitationKeys.all, "trip", tripId] as const,
  preview: (rawToken: string) => [...invitationKeys.all, "preview", rawToken] as const,
};

export function useMyPendingInvitationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: invitationKeys.mine(),
    queryFn: getMyPendingInvitations,
    enabled,
  });
}

export function useTripInvitationsQuery(tripId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: invitationKeys.trip(tripId ?? ""),
    queryFn: () => getTripInvitations(tripId!),
    enabled: Boolean(tripId) && enabled,
  });
}

export function useInvitationPreviewQuery(rawToken: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: invitationKeys.preview(rawToken ?? ""),
    queryFn: () => getInvitationPreview(rawToken!),
    enabled: Boolean(rawToken) && enabled,
  });
}

async function invalidateAfterMembershipChange(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: tripKeys.all }),
    queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
    tripId
      ? queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
      : Promise.resolve(),
  ]);
}

export function useCreateEmailInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEmailInvitationInput & { sendEmail?: boolean }) => {
      const created = await createEmailInvitation(input);
      let emailSent = false;
      let emailReason: string | undefined;

      if (input.sendEmail !== false) {
        const result = await sendInvitationEmail({
          invitationId: created.invitationId,
          email: input.email,
          inviteLink: created.inviteLink,
          intendedRole: input.role,
          expiresAt: created.expiresAt,
        });
        emailSent = result.sent;
        emailReason = result.reason;
      }

      return { ...created, emailSent, emailReason };
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.trip(variables.tripId) }),
        queryClient.invalidateQueries({ queryKey: invitationKeys.mine() }),
      ]);
    },
  });
}

export function useCreateShareInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShareInvitationInput) => createShareInvitation(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys.trip(variables.tripId) });
    },
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rawToken: string) => acceptInvitation(rawToken),
    onSuccess: async (tripId) => {
      await invalidateAfterMembershipChange(queryClient, tripId);
    },
  });
}

export function useAcceptInvitationByIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitationById(invitationId),
    onSuccess: async (tripId) => {
      await invalidateAfterMembershipChange(queryClient, tripId);
    },
  });
}

export function useDeclineInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rawToken: string) => declineInvitation(rawToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
    },
  });
}

export function useDeclineInvitationByIdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => declineInvitationById(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { invitationId: string; tripId: string }) =>
      revokeInvitation(input.invitationId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.trip(variables.tripId) }),
        queryClient.invalidateQueries({ queryKey: invitationKeys.mine() }),
      ]);
    },
  });
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemberRoleInput) => updateMemberRole(input),
    onSuccess: async (_data, variables) => {
      await invalidateAfterMembershipChange(queryClient, variables.tripId);
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoveMemberInput) => removeMember(input),
    onSuccess: async (_data, variables) => {
      await invalidateAfterMembershipChange(queryClient, variables.tripId);
    },
  });
}

export function useLeaveTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => leaveTrip(tripId),
    onSuccess: async (_data, tripId) => {
      await invalidateAfterMembershipChange(queryClient, tripId);
    },
  });
}

export function useTransferOwnershipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferOwnershipInput) => transferOwnership(input),
    onSuccess: async (_data, variables) => {
      await invalidateAfterMembershipChange(queryClient, variables.tripId);
    },
  });
}
