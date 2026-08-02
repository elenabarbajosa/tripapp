import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { TripCard } from "@/components/TripCard/TripCard";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { branding } from "@/constants/branding";
import {
  mockCurrentUser,
  mockInvitations,
  mockPreviousTrips,
  mockUpcomingTrip,
} from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import { mapInvitationError } from "@/features/invitations/errors";
import {
  useAcceptInvitationByIdMutation,
  useDeclineInvitationByIdMutation,
  useMyPendingInvitationsQuery,
} from "@/features/invitations/hooks";
import { useResumePendingInvite } from "@/features/invitations/useResumePendingInvite";
import { usePreview } from "@/features/preview/PreviewProvider";
import { partitionTrips } from "@/features/trips/api";
import { useMyTripsQuery } from "@/features/trips/hooks";
import { roleLabel } from "@/features/trips/permissions";
import type { MemberRole } from "@/types/models";
import { formatInvitationExpiry } from "@/utils/date";
import { styles } from "./HomeScreen.styles";

interface HomeInvitationItem {
  id: string;
  tripId: string;
  tripName: string;
  inviterDisplayName: string;
  destinationSummary: string;
  intendedRole: Exclude<MemberRole, "owner">;
  expiresAt: string;
  interactive: boolean;
}

export function HomeScreen() {
  const router = useRouter();
  const { profile, isAuthenticated } = useAuth();
  const { isPreviewActive } = usePreview();
  const shouldLoadTrips = isAuthenticated && !isPreviewActive;
  const shouldLoadInvitations = isAuthenticated && !isPreviewActive;
  const tripsQuery = useMyTripsQuery(shouldLoadTrips);
  const invitationsQuery = useMyPendingInvitationsQuery(shouldLoadInvitations);
  const { refetch: refetchInvitations } = invitationsQuery;
  const acceptMutation = useAcceptInvitationByIdMutation();
  const declineMutation = useDeclineInvitationByIdMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useResumePendingInvite(isAuthenticated && !isPreviewActive);

  useFocusEffect(
    useCallback(() => {
      if (shouldLoadInvitations) {
        void refetchInvitations();
      }
    }, [refetchInvitations, shouldLoadInvitations]),
  );

  const greetingName =
    (isAuthenticated && profile?.displayName) ||
    (isPreviewActive ? mockCurrentUser.displayName : null) ||
    "there";
  const firstName = greetingName.split(" ")[0] ?? greetingName;

  const previewUpcoming = [mockUpcomingTrip];
  const previewPrevious = mockPreviousTrips;

  const liveTrips = tripsQuery.data ? partitionTrips(tripsQuery.data) : null;
  const upcoming = isPreviewActive ? previewUpcoming : (liveTrips?.upcoming ?? []);
  const previous = isPreviewActive ? previewPrevious : (liveTrips?.previous ?? []);

  const liveInvitations: HomeInvitationItem[] = (invitationsQuery.data ?? []).map((invitation) => ({
    id: invitation.id,
    tripId: invitation.tripId,
    tripName: invitation.tripName,
    inviterDisplayName: invitation.inviterDisplayName,
    destinationSummary: invitation.destinationSummary,
    intendedRole: invitation.intendedRole,
    expiresAt: invitation.expiresAt,
    interactive: true,
  }));

  const previewInvitationItems: HomeInvitationItem[] = mockInvitations.map((invitation) => ({
    id: invitation.id,
    tripId: invitation.tripId,
    tripName: invitation.tripName,
    inviterDisplayName: invitation.inviterName,
    destinationSummary: invitation.destinationSummary,
    intendedRole: invitation.intendedRole,
    expiresAt: invitation.expiresAt,
    interactive: false,
  }));

  const invitations = isPreviewActive ? previewInvitationItems : liveInvitations;
  const hasInvitations = invitations.length > 0;

  const isEmpty =
    shouldLoadTrips &&
    !tripsQuery.isLoading &&
    !tripsQuery.isError &&
    upcoming.length === 0 &&
    previous.length === 0 &&
    !hasInvitations;
  const showPreviewOrLoaded = isPreviewActive || (!tripsQuery.isLoading && !tripsQuery.isError);

  const onAccept = async (invitation: HomeInvitationItem) => {
    if (!invitation.interactive) {
      return;
    }
    setActionError(null);
    setPendingActionId(invitation.id);
    try {
      const tripId = await acceptMutation.mutateAsync(invitation.id);
      router.push(`/trips/${tripId}/overview`);
    } catch (error) {
      setActionError(mapInvitationError(error));
    } finally {
      setPendingActionId(null);
    }
  };

  const onDecline = async (invitation: HomeInvitationItem) => {
    if (!invitation.interactive) {
      return;
    }
    setActionError(null);
    setPendingActionId(invitation.id);
    try {
      await declineMutation.mutateAsync(invitation.id);
    } catch (error) {
      setActionError(mapInvitationError(error));
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.greeting}>Welcome back, {firstName}</Text>
          <Text style={styles.title}>{branding.productName}</Text>
        </View>

        {shouldLoadTrips && tripsQuery.isLoading ? (
          <LoadingState label="Loading your trips…" />
        ) : null}

        {shouldLoadTrips && tripsQuery.isError ? (
          <ErrorState
            title="Could not load trips"
            message={
              tripsQuery.error instanceof Error
                ? tripsQuery.error.message
                : "Check your connection and try again."
            }
            onRetry={() => {
              void tripsQuery.refetch();
            }}
          />
        ) : null}

        {isEmpty ? (
          <EmptyState
            title={branding.emptyHomeTitle}
            body={branding.emptyHomeBody}
            actionLabel="Create your first trip"
            onAction={() => router.push("/trips/new/basics")}
          />
        ) : null}

        {showPreviewOrLoaded && !isEmpty ? (
          <>
            {hasInvitations ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invitations</Text>
                {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
                {shouldLoadInvitations && invitationsQuery.isError ? (
                  <Text style={styles.actionError}>
                    {mapInvitationError(invitationsQuery.error)}
                  </Text>
                ) : null}
                {invitations.map((invitation) => {
                  const busy = pendingActionId === invitation.id;
                  return (
                    <AppCard key={invitation.id} variant="elevated">
                      <View style={styles.invitationCard}>
                        <View style={styles.invitationBadges}>
                          <StatusBadge label="Invitation" variant="invitation" />
                          <StatusBadge
                            label={roleLabel(invitation.intendedRole)}
                            variant="muted"
                          />
                        </View>
                        <Text style={styles.invitationTitle}>{invitation.tripName}</Text>
                        <Text style={styles.invitationMeta}>
                          Invited by {invitation.inviterDisplayName}
                        </Text>
                        {invitation.destinationSummary ? (
                          <Text style={styles.invitationMeta}>
                            {invitation.destinationSummary}
                          </Text>
                        ) : null}
                        <Text style={styles.invitationMeta}>
                          {formatInvitationExpiry(invitation.expiresAt)}
                        </Text>
                        <View style={styles.invitationActions}>
                          <View style={styles.invitationAction}>
                            <AppButton
                              label="Accept"
                              size="sm"
                              loading={busy && acceptMutation.isPending}
                              disabled={
                                !invitation.interactive ||
                                busy ||
                                acceptMutation.isPending ||
                                declineMutation.isPending
                              }
                              onPress={() => {
                                void onAccept(invitation);
                              }}
                            />
                          </View>
                          <View style={styles.invitationAction}>
                            <AppButton
                              label="Decline"
                              size="sm"
                              variant="secondary"
                              loading={busy && declineMutation.isPending}
                              disabled={
                                !invitation.interactive ||
                                busy ||
                                acceptMutation.isPending ||
                                declineMutation.isPending
                              }
                              onPress={() => {
                                void onDecline(invitation);
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    </AppCard>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                <AppButton
                  label="Create trip"
                  size="sm"
                  fullWidth={false}
                  onPress={() => router.push("/trips/new/basics")}
                />
              </View>
              {upcoming.length === 0 ? (
                <Text style={styles.invitationMeta}>No upcoming trips yet.</Text>
              ) : (
                upcoming.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onPress={() => router.push(`/trips/${trip.id}/overview`)}
                  />
                ))
              )}
            </View>

            {previous.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Previous trips</Text>
                {previous.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    muted
                    onPress={() => router.push(`/trips/${trip.id}/overview`)}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
