import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { mockUpcomingTrip } from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useDeleteTripMutation, useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canDeleteTrip, canManageTripSettings, roleLabel } from "@/features/trips/permissions";
import { formatDateRange } from "@/utils/date";
import { resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./TripSettingsScreen.styles";

export function TripSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();
  const deleteTripMutation = useDeleteTripMutation();

  const shouldLoad =
    !isInitializing && isAuthenticated && !isPreviewActive && Boolean(tripId);
  const tripQuery = useTripQuery(tripId, shouldLoad);
  const trip = isPreviewActive ? mockUpcomingTrip : tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const isOwner = isPreviewActive || canManageTripSettings(role);

  const onDelete = () => {
    if (!tripId || !canDeleteTrip(role)) {
      return;
    }

    Alert.alert(
      "Delete trip?",
      "This permanently deletes the trip and its generated days. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteTripMutation.mutateAsync(tripId);
                router.replace("/(main)/home");
              } catch (error) {
                Alert.alert(
                  "Delete failed",
                  error instanceof Error ? error.message : "Unable to delete trip.",
                );
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Trip settings"
        subtitle="Basics and ownership"
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
        {shouldLoad && tripQuery.isLoading ? <LoadingState label="Loading settings…" /> : null}

        {shouldLoad && tripQuery.isError ? (
          <ErrorState
            title="Could not load settings"
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

        {trip ? (
          <>
            <AppCard>
              <View style={styles.block}>
                <Text style={styles.label}>Trip name</Text>
                <Text style={styles.value}>{trip.name}</Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>Dates</Text>
                <Text style={styles.value}>
                  {formatDateRange(trip.startDate, trip.endDate)}
                </Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>Currency</Text>
                <Text style={styles.value}>
                  Trip {trip.currency}
                  {trip.homeCurrency ? ` · Home ${trip.homeCurrency}` : ""}
                </Text>
              </View>
              <View style={styles.block}>
                <Text style={styles.label}>Your role</Text>
                <Text style={styles.value}>{role ? roleLabel(role) : "Preview"}</Text>
              </View>
            </AppCard>

            <Text style={styles.note}>
              Editing trip details and transferring ownership will expand in a later phase. Invitations
              arrive in Phase 3B.
            </Text>

            {isOwner ? (
              <AppButton
                label={deleteTripMutation.isPending ? "Deleting…" : "Delete trip"}
                variant="secondary"
                onPress={onDelete}
                disabled={isPreviewActive || deleteTripMutation.isPending}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
