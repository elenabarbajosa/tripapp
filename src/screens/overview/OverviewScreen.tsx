import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BookingCard } from "@/components/BookingCard/BookingCard";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { mockTripOverview } from "@/data/mock";
import { formatCurrency } from "@/utils/currency";
import { formatCountdown, formatTimeLabel } from "@/utils/date";
import { styles } from "./OverviewScreen.styles";

export function OverviewScreen() {
  const { trip, nextActivity, upcomingBooking, openVotes, budget, packing, planningProgressPercent } =
    mockTripOverview;

  const destinationLabel = trip.destinations.map((d) => d.city).join(" · ");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard variant="elevated">
          <View style={styles.heroCard}>
            <Text style={styles.countdown}>{formatCountdown(trip.startDate)}</Text>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.destinations}>{destinationLabel}</Text>
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
            <Text style={styles.nextActivityMeta}>No upcoming activity yet.</Text>
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
              {packing.sharedCompleted}/{packing.sharedTotal}
            </Text>
            <ProgressBar
              progress={Math.round((packing.sharedCompleted / packing.sharedTotal) * 100)}
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
