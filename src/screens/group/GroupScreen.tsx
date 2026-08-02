import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { MemberAvatar } from "@/components/MemberAvatar/MemberAvatar";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { mockUpcomingTrip } from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import type { InviteRole } from "@/features/invitations/api";
import { mapInvitationError } from "@/features/invitations/errors";
import {
  useLeaveTripMutation,
  useRemoveMemberMutation,
  useRevokeInvitationMutation,
  useTransferOwnershipMutation,
  useTripInvitationsQuery,
  useUpdateMemberRoleMutation,
} from "@/features/invitations/hooks";
import { useTripMembersRealtime } from "@/features/invitations/useTripMembersRealtime";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { getTripQueryErrorDebug } from "@/features/trips/errors";
import { currentUserRole } from "@/features/trips/mappers";
import {
  canInviteMembers,
  canLeaveTrip,
  canRemoveMember,
  canRevokeInvitation,
  canTransferOwnership,
  canChangeMemberRoles,
  roleLabel,
} from "@/features/trips/permissions";
import type { TripMember } from "@/types/models";
import { formatInvitationExpiry } from "@/utils/date";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./GroupScreen.styles";

type ConfirmAction =
  | { kind: "remove"; member: TripMember }
  | { kind: "transfer"; member: TripMember }
  | { kind: "changeRole"; member: TripMember; nextRole: InviteRole }
  | { kind: "leave" }
  | { kind: "revoke"; invitationId: string; label: string };

export function GroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripId?: string | string[];
  }>();
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  const resolvedTripId = resolveRouteParam(tripId);
  const hasValidTripId = isValidUuid(resolvedTripId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId;

  const tripQuery = useTripQuery(resolvedTripId, shouldLoad);

  const trip = isPreviewActive ? mockUpcomingTrip : (tripQuery.data ?? null);
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const isOwner = isPreviewActive || canInviteMembers(role);
  const canManageRoles = isPreviewActive || canChangeMemberRoles(role);
  const canTransfer = isPreviewActive || canTransferOwnership(role);
  const canRevoke = isPreviewActive || canRevokeInvitation(role);
  const canLeave = !isPreviewActive && canLeaveTrip(role);

  const invitationsQuery = useTripInvitationsQuery(
    resolvedTripId,
    shouldLoad && Boolean(trip) && canInviteMembers(role),
  );
  useTripMembersRealtime(resolvedTripId, shouldLoad);

  const updateRoleMutation = useUpdateMemberRoleMutation();
  const removeMemberMutation = useRemoveMemberMutation();
  const transferMutation = useTransferOwnershipMutation();
  const leaveMutation = useLeaveTripMutation();
  const revokeMutation = useRevokeInvitationMutation();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingInvitations = (invitationsQuery.data ?? []).filter(
    (invitation) => invitation.status === "pending",
  );

  const isMutating =
    updateRoleMutation.isPending ||
    removeMemberMutation.isPending ||
    transferMutation.isPending ||
    leaveMutation.isPending ||
    revokeMutation.isPending;

  const closeConfirm = () => {
    if (!isMutating) {
      setConfirmAction(null);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction || !hasValidTripId || !resolvedTripId || isPreviewActive) {
      setConfirmAction(null);
      return;
    }

    setActionError(null);
    try {
      switch (confirmAction.kind) {
        case "remove":
          await removeMemberMutation.mutateAsync({
            tripId: resolvedTripId,
            memberUserId: confirmAction.member.profile.id,
          });
          break;
        case "transfer":
          await transferMutation.mutateAsync({
            tripId: resolvedTripId,
            newOwnerUserId: confirmAction.member.profile.id,
          });
          break;
        case "changeRole":
          await updateRoleMutation.mutateAsync({
            tripId: resolvedTripId,
            memberUserId: confirmAction.member.profile.id,
            role: confirmAction.nextRole,
          });
          break;
        case "leave":
          await leaveMutation.mutateAsync(resolvedTripId);
          setConfirmAction(null);
          router.replace("/(main)/home");
          return;
        case "revoke":
          await revokeMutation.mutateAsync({
            invitationId: confirmAction.invitationId,
            tripId: resolvedTripId,
          });
          break;
      }
      setConfirmAction(null);
    } catch (error) {
      setActionError(mapInvitationError(error));
      setConfirmAction(null);
    }
  };

  const confirmCopy = (action: ConfirmAction) => {
    switch (action.kind) {
      case "remove":
        return {
          title: "Remove traveller?",
          message: `Remove ${action.member.profile.displayName} from this trip? They will lose access immediately.`,
          confirmLabel: "Remove",
          destructive: true,
        };
      case "transfer":
        return {
          title: "Transfer ownership?",
          message: `Make ${action.member.profile.displayName} the owner? You will become an editor.`,
          confirmLabel: "Transfer",
          destructive: false,
        };
      case "changeRole":
        return {
          title: "Change role?",
          message: `Set ${action.member.profile.displayName} to ${roleLabel(action.nextRole)}?`,
          confirmLabel: "Change role",
          destructive: false,
        };
      case "leave":
        return {
          title: "Leave trip?",
          message: "You will lose access to this trip. You can rejoin only with a new invitation.",
          confirmLabel: "Leave trip",
          destructive: true,
        };
      case "revoke":
        return {
          title: "Revoke invitation?",
          message: `Revoke the invitation for ${action.label}? The link will stop working.`,
          confirmLabel: "Revoke",
          destructive: true,
        };
    }
  };

  const dialogCopy = confirmAction ? confirmCopy(confirmAction) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Group"
        subtitle="Travellers on this trip"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {!isPreviewActive && !hasValidTripId ? (
          <EmptyState
            title="Trip not found"
            body="This group link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {shouldLoad && tripQuery.isLoading ? <LoadingState label="Loading members…" /> : null}

        {shouldLoad && tripQuery.isError ? (
          <ErrorState
            title="Could not load group"
            message={(() => {
              const readable =
                tripQuery.error instanceof Error
                  ? tripQuery.error.message
                  : "Try again in a moment.";
              if (!__DEV__) {
                return readable;
              }
              const debug = getTripQueryErrorDebug(tripQuery.error);
              if (!debug) {
                return readable;
              }
              const parts = [
                readable,
                debug.code ? `code=${debug.code}` : null,
                debug.details ? `details=${debug.details}` : null,
                debug.hint ? `hint=${debug.hint}` : null,
              ].filter(Boolean);
              return parts.join("\n");
            })()}
            onRetry={() => {
              void tripQuery.refetch();
            }}
          />
        ) : null}

        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

        {trip && trip.members.length === 0 ? (
          <EmptyState title="No members yet" body="You will appear here after trip creation." />
        ) : null}

        {trip
          ? trip.members.map((member) => {
              const isSelf = Boolean(user?.id) && member.profile.id === user?.id;
              const showEmail =
                isOwner || isSelf || Boolean(member.profile.email);
              const canRemove = canRemoveMember(role, member.role, isSelf);
              const nextRole: InviteRole | null =
                member.role === "editor"
                  ? "viewer"
                  : member.role === "viewer"
                    ? "editor"
                    : null;

              return (
                <AppCard key={member.id}>
                  <View style={styles.memberRow}>
                    <MemberAvatar
                      name={member.profile.displayName}
                      imageUrl={member.profile.avatarUrl}
                      size="lg"
                    />
                    <View style={styles.memberMeta}>
                      <View style={styles.nameRow}>
                        <Text style={styles.memberName}>{member.profile.displayName}</Text>
                        {isSelf ? <Text style={styles.youLabel}>You</Text> : null}
                      </View>
                      {showEmail && member.profile.email ? (
                        <Text style={styles.memberEmail}>{member.profile.email}</Text>
                      ) : null}
                      <View style={styles.badgeRow}>
                        <StatusBadge
                          label={roleLabel(member.role)}
                          variant={member.role === "owner" ? "invitation" : "confirmed"}
                        />
                      </View>
                    </View>
                  </View>

                  {!isPreviewActive && canManageRoles && nextRole ? (
                    <View style={styles.actionRow}>
                      <AppButton
                        label={`Make ${roleLabel(nextRole)}`}
                        size="sm"
                        variant="secondary"
                        disabled={isMutating}
                        onPress={() =>
                          setConfirmAction({ kind: "changeRole", member, nextRole })
                        }
                      />
                      {canRemove ? (
                        <AppButton
                          label="Remove"
                          size="sm"
                          variant="destructive"
                          disabled={isMutating}
                          onPress={() => setConfirmAction({ kind: "remove", member })}
                        />
                      ) : null}
                      {canTransfer ? (
                        <AppButton
                          label="Make owner"
                          size="sm"
                          variant="ghost"
                          disabled={isMutating}
                          onPress={() => setConfirmAction({ kind: "transfer", member })}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </AppCard>
              );
            })
          : null}

        {trip && isOwner ? (
          <View style={styles.inviteBlock}>
            <Text style={styles.inviteTitle}>Invitations</Text>
            {!isPreviewActive ? (
              <AppButton
                label="Invite traveller"
                onPress={() => {
                  if (!isValidUuid(resolvedTripId)) {
                    return;
                  }
                  router.push({
                    pathname: "/trips/[tripId]/invite",
                    params: { tripId: resolvedTripId },
                  });
                }}
              />
            ) : (
              <Text style={styles.inviteBody}>
                Preview mode shows members only. Sign in to send invitations.
              </Text>
            )}

            {!isPreviewActive && pendingInvitations.length > 0 ? (
              <View style={styles.pendingList}>
                <Text style={styles.pendingTitle}>Pending invitations</Text>
                {pendingInvitations.map((invitation) => (
                  <AppCard key={invitation.id} variant="muted">
                    <View style={styles.pendingCard}>
                      <Text style={styles.pendingLabel}>
                        {invitation.invitedEmail ?? "Share link"}
                      </Text>
                      <Text style={styles.memberEmail}>
                        {roleLabel(invitation.intendedRole)} ·{" "}
                        {formatInvitationExpiry(invitation.expiresAt)}
                      </Text>
                      {canRevoke ? (
                        <AppButton
                          label="Revoke"
                          size="sm"
                          variant="secondary"
                          disabled={isMutating}
                          onPress={() =>
                            setConfirmAction({
                              kind: "revoke",
                              invitationId: invitation.id,
                              label: invitation.invitedEmail ?? "this share link",
                            })
                          }
                        />
                      ) : null}
                    </View>
                  </AppCard>
                ))}
              </View>
            ) : null}

            {!isPreviewActive &&
            invitationsQuery.isSuccess &&
            pendingInvitations.length === 0 ? (
              <Text style={styles.inviteBody}>No pending invitations.</Text>
            ) : null}
          </View>
        ) : null}

        {trip && canLeave ? (
          <View style={styles.leaveBlock}>
            <AppButton
              label="Leave trip"
              variant="destructive"
              disabled={isMutating}
              onPress={() => setConfirmAction({ kind: "leave" })}
            />
          </View>
        ) : null}
      </ScrollView>

      {dialogCopy && confirmAction ? (
        <ConfirmationDialog
          visible
          title={dialogCopy.title}
          message={dialogCopy.message}
          confirmLabel={dialogCopy.confirmLabel}
          destructive={dialogCopy.destructive}
          onCancel={closeConfirm}
          onConfirm={() => {
            void runConfirmedAction();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
