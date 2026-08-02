import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { TripCard } from "@/components/TripCard/TripCard";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { branding } from "@/constants/branding";
import {
  mockCurrentUser,
  mockInvitations,
  mockPreviousTrips,
  mockUpcomingTrip,
} from "@/data/mock";
import { styles } from "./HomeScreen.styles";

const showEmptyHome = false;

export function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={styles.greeting}>Welcome back, {mockCurrentUser.displayName.split(" ")[0]}</Text>
          <Text style={styles.title}>{branding.productName}</Text>
        </View>

        {showEmptyHome ? (
          <EmptyState
            title={branding.emptyHomeTitle}
            body={branding.emptyHomeBody}
            actionLabel="Create your first trip"
            onAction={() => router.push("/trips/new/basics")}
          />
        ) : (
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
              <TripCard
                trip={mockUpcomingTrip}
                onPress={() => router.push(`/trips/${mockUpcomingTrip.id}/overview`)}
              />
            </View>

            {mockInvitations.length > 0 ? (
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Previous trips</Text>
              {mockPreviousTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} muted onPress={() => undefined} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
