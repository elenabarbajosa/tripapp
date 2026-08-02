import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { BookingCard } from "@/components/BookingCard/BookingCard";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { mockTripOverview } from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { formatCurrency } from "@/utils/currency";
import { formatCountdown, formatTimeLabel } from "@/utils/date";
import { resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./OverviewScreen.styles";

export function OverviewScreen() {
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const { isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const shouldLoad =
    !isInitializing && isAuthenticated && !isPreviewActive && Boolean(tripId);
  const tripQuery = useTripQuery(tripId, shouldLoad);

  if (shouldLoad && tripQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <LoadingState label="Loading trip…" />
      </SafeAreaView>
    );
  }

  if (shouldLoad && tripQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ErrorState
          title="Could not load trip"
          message={
            tripQuery.error instanceof Error
              ? tripQuery.error.message
              : "Check your connection and try again."
          }
          onRetry={() => {
            void tripQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  if (shouldLoad && !tripQuery.data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ErrorState title="Trip not found" message="This trip may have been deleted or you no longer have access." />
      </SafeAreaView>
    );
  }

  const liveTrip = tripQuery.data;
  const useMockExtras = isPreviewActive || !liveTrip;

  const trip = liveTrip ?? mockTripOverview.trip;
  const nextActivity = useMockExtras ? mockTripOverview.nextActivity : null;
  const upcomingBooking = useMockExtras ? mockTripOverview.upcomingBooking : null;
  const openVotes = useMockExtras ? mockTripOverview.openVotes : [];
  const budget = useMockExtras
    ? mockTripOverview.budget
    : {
        totalBudget: 0,
        amountSpent: 0,
        remaining: 0,
        currency: trip.currency,
        percentUsed: 0,
      };
  const packing = useMockExtras
    ? mockTripOverview.packing
    : { sharedCompleted: 0, sharedTotal: 0, personalCompleted: 0, personalTotal: 0 };
  const planningProgressPercent = useMockExtras ? mockTripOverview.planningProgressPercent : 5;

  const destinationLabel = trip.destinations.map((d) => d.city).join(" · ");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard variant="elevated">
          <View style={styles.heroCard}>
            <Text style={styles.countdown}>{formatCountdown(trip.startDate)}</Text>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.destinations}>{destinationLabel || "No destinations"}</Text>
            <Text style={styles.nextActivityMeta}>
              {trip.travellerCount} traveller{trip.travellerCount === 1 ? "" : "s"} · {trip.currency}
            </Text>
            <ProgressBar
              progress={planningProgressPercent}
              accessibilityLabel={`Planning progress ${planningProgressPercent}%`}
            />
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.question}>What are we doing next?</Text>
          {nextActivity ? (
            <>
              <Text style={styles.nextActivityMeta}>
                {formatTimeLabel(nextActivity.startTime)} · {nextActivity.name}
              </Text>
              {nextActivity.locationName ? (
                <Text style={styles.nextActivityMeta}>{nextActivity.locationName}</Text>
              ) : null}
              <StatusBadge
                label={nextActivity.status === "confirmed" ? "Confirmed" : "Tentative"}
                variant={nextActivity.status}
              />
            </>
          ) : (
            <Text style={styles.nextActivityMeta}>
              {useMockExtras
                ? "No upcoming activity yet."
                : "Add plans in Itinerary"}
            </Text>
          )}
        </AppCard>

        {upcomingBooking ? (
          <View>
            <Text style={styles.sectionTitle}>Important booking</Text>
            <BookingCard booking={upcomingBooking} />
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <Text style={styles.statLabel}>Budget left</Text>
            <Text style={styles.statValue}>
              {formatCurrency(budget.remaining, budget.currency)}
            </Text>
            <ProgressBar progress={budget.percentUsed} />
          </AppCard>
          <AppCard style={styles.statCard}>
            <Text style={styles.statLabel}>Packing</Text>
            <Text style={styles.statValue}>
              {packing.sharedTotal === 0
                ? "—"
                : `${packing.sharedCompleted}/${packing.sharedTotal}`}
            </Text>
            <ProgressBar
              progress={
                packing.sharedTotal === 0
                  ? 0
                  : Math.round((packing.sharedCompleted / packing.sharedTotal) * 100)
              }
            />
          </AppCard>
        </View>

        {openVotes.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Open votes</Text>
            {openVotes.map((vote) => (
              <AppCard key={vote.id}>
                <Text style={styles.voteQuestion}>{vote.question}</Text>
                <Text style={styles.voteMeta}>
                  {vote.responseCount} votes · {vote.optionCount} options
                </Text>
              </AppCard>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
