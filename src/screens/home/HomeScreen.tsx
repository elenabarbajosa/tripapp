import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

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
import { usePreview } from "@/features/preview/PreviewProvider";
import { partitionTrips } from "@/features/trips/api";
import { useMyTripsQuery } from "@/features/trips/hooks";
import { styles } from "./HomeScreen.styles";

export function HomeScreen() {
  const router = useRouter();
  const { profile, isAuthenticated } = useAuth();
  const { isPreviewActive } = usePreview();
  const shouldLoadTrips = isAuthenticated && !isPreviewActive;
  const tripsQuery = useMyTripsQuery(shouldLoadTrips);

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
  const showInvitations = isPreviewActive && mockInvitations.length > 0;
  const isEmpty =
    shouldLoadTrips && !tripsQuery.isLoading && !tripsQuery.isError && upcoming.length === 0 && previous.length === 0;
  const showPreviewOrLoaded = isPreviewActive || (!tripsQuery.isLoading && !tripsQuery.isError);

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

            {showInvitations ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invitations</Text>
                {mockInvitations.map((invitation) => (
                  <AppCard key={invitation.id} variant="elevated">
                    <View style={styles.invitationCard}>
                      <StatusBadge label="Invitation" variant="invitation" />
                      <Text style={styles.invitationTitle}>{invitation.tripName}</Text>
                      <Text style={styles.invitationMeta}>
                        Invited by {invitation.inviterName}
                      </Text>
                      <View style={styles.invitationActions}>
                        <View style={styles.invitationAction}>
                          <AppButton label="Accept" size="sm" onPress={() => undefined} />
                        </View>
                        <View style={styles.invitationAction}>
                          <AppButton
                            label="Decline"
                            size="sm"
                            variant="secondary"
                            onPress={() => undefined}
                          />
                        </View>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            ) : null}

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
