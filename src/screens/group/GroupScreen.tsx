import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { MemberAvatar } from "@/components/MemberAvatar/MemberAvatar";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { mockUpcomingTrip } from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { canInviteMembers, roleLabel } from "@/features/trips/permissions";
import { currentUserRole } from "@/features/trips/mappers";
import { styles } from "./GroupScreen.styles";

export function GroupScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { isPreviewActive } = usePreview();

  const shouldLoad = isAuthenticated && !isPreviewActive && Boolean(tripId);
  const tripQuery = useTripQuery(tripId, shouldLoad);

  const trip = isPreviewActive ? mockUpcomingTrip : (tripQuery.data ?? null);
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const canInvite = isPreviewActive || canInviteMembers(role);

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
        {shouldLoad && tripQuery.isLoading ? <LoadingState label="Loading members…" /> : null}

        {shouldLoad && tripQuery.isError ? (
          <ErrorState
            title="Could not load group"
            message={
              tripQuery.error instanceof Error
                ? tripQuery.error.message
                : "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
            }}
          />
        ) : null}

        {trip && trip.members.length === 0 ? (
          <EmptyState title="No members yet" body="You will appear here after trip creation." />
        ) : null}

        {trip
          ? trip.members.map((member) => (
              <AppCard key={member.id}>
                <View style={styles.memberRow}>
                  <MemberAvatar
                    name={member.profile.displayName}
                    imageUrl={member.profile.avatarUrl}
                    size="lg"
                  />
                  <View style={styles.memberMeta}>
                    <Text style={styles.memberName}>{member.profile.displayName}</Text>
                    <Text style={styles.memberEmail}>{member.profile.email || "No email"}</Text>
                  </View>
                  <StatusBadge label={roleLabel(member.role)} variant="confirmed" />
                </View>
              </AppCard>
            ))
          : null}

        {trip && canInvite ? (
          <View style={styles.inviteBlock}>
            <Text style={styles.inviteTitle}>Invitations</Text>
            <Text style={styles.inviteBody}>
              Email invites and share links arrive in Phase 3B. Role changes and removals are also
              deferred.
            </Text>
            <AppButton label="Invite travellers (soon)" variant="secondary" disabled />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
