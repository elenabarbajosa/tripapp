import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { ItineraryActivityCard } from "@/components/ItineraryActivityCard/ItineraryActivityCard";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  defaultSelectedDayId,
  formatDayChipParts,
} from "@/features/itinerary/daySelection";
import { getItineraryErrorDebug } from "@/features/itinerary/errors";
import {
  useDeleteTripActivityMutation,
  useReorderTripActivitiesMutation,
  useTripItineraryQuery,
} from "@/features/itinerary/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import {
  canCreateActivity,
  canDeleteActivity,
  canEditActivity,
  canReorderActivities,
} from "@/features/trips/permissions";
import type { TripActivity } from "@/types/models";
import { formatDateRange, toISODate } from "@/utils/date";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./ItineraryScreen.styles";

export function ItineraryScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const itineraryQuery = useTripItineraryQuery(tripId, shouldLoad && Boolean(tripQuery.data));

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const days = useMemo(() => itineraryQuery.data ?? [], [itineraryQuery.data]);

  const canAdd = !isPreviewActive && canCreateActivity(role);
  const canEdit = !isPreviewActive && canEditActivity(role);
  const canDelete = !isPreviewActive && canDeleteActivity(role);
  const canReorder = !isPreviewActive && canReorderActivities(role);

  const defaultDayId = useMemo(
    () => defaultSelectedDayId(days, toISODate(new Date())),
    [days],
  );
  const [selectedDayIdOverride, setSelectedDayIdOverride] = useState<string | null>(null);
  const selectedDayId =
    selectedDayIdOverride && days.some((day) => day.id === selectedDayIdOverride)
      ? selectedDayIdOverride
      : defaultDayId;

  const [pendingDelete, setPendingDelete] = useState<TripActivity | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteMutation = useDeleteTripActivityMutation();
  const reorderMutation = useReorderTripActivitiesMutation();
  const isMutating = deleteMutation.isPending || reorderMutation.isPending;

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) ?? null,
    [days, selectedDayId],
  );

  const onAddActivity = () => {
    if (!hasValidTripId || !tripId || !selectedDayId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/activities/new",
      params: { tripId, dayId: selectedDayId },
    });
  };

  const onEditActivity = (activity: TripActivity) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/activities/[activityId]/edit",
      params: { tripId, activityId: activity.id },
    });
  };

  const onMoveActivity = async (activityId: string, direction: "up" | "down") => {
    if (!hasValidTripId || !tripId || !selectedDay || isPreviewActive) {
      return;
    }

    const ids = selectedDay.activities.map((activity) => activity.id);
    const index = ids.indexOf(activityId);
    if (index < 0) {
      return;
    }
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= ids.length) {
      return;
    }

    const nextIds = [...ids];
    const current = nextIds[index];
    const other = nextIds[swapWith];
    if (!current || !other) {
      return;
    }
    nextIds[index] = other;
    nextIds[swapWith] = current;

    setActionError(null);
    try {
      await reorderMutation.mutateAsync({
        tripId,
        tripDayId: selectedDay.id,
        activityIds: nextIds,
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to reorder activities.",
      );
    }
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete || !hasValidTripId || !tripId || isPreviewActive) {
      setPendingDelete(null);
      return;
    }

    setActionError(null);
    try {
      await deleteMutation.mutateAsync({
        tripId,
        activityId: pendingDelete.id,
      });
      setPendingDelete(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete activity.",
      );
      setPendingDelete(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isPreviewActive && !hasValidTripId ? (
          <EmptyState
            title="Trip not found"
            body="This itinerary link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Itinerary preview"
            body="Sign in and open a live trip to plan day-by-day activities."
          />
        ) : null}

        {shouldLoad && (tripQuery.isLoading || itineraryQuery.isLoading) ? (
          <LoadingState label="Loading itinerary…" />
        ) : null}

        {shouldLoad && tripQuery.isError ? (
          <ErrorState
            title="Could not load trip"
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

        {shouldLoad && !tripQuery.isError && itineraryQuery.isError ? (
          <ErrorState
            title="Could not load itinerary"
            message={(() => {
              const readable =
                itineraryQuery.error instanceof Error
                  ? itineraryQuery.error.message
                  : "Try again in a moment.";
              if (!__DEV__) {
                return readable;
              }
              const debug = getItineraryErrorDebug(itineraryQuery.error);
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
              void itineraryQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && !itineraryQuery.isError ? (
          <>
            {trip.startDate && trip.endDate ? (
              <Text style={styles.daySubtitle}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>
            ) : null}

            {days.length === 0 ? (
              <EmptyState
                title="No days yet"
                body="Trip days appear after the trip dates are set."
              />
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daySelector}
                >
                  {days.map((day, index) => {
                    const selected = day.id === selectedDayId;
                    const chip = formatDayChipParts(day.date);
                    return (
                      <Pressable
                        key={day.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Day ${index + 1}, ${chip.weekday} ${chip.monthDay}`}
                        onPress={() => setSelectedDayIdOverride(day.id)}
                        style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
                      >
                        <Text
                          style={[
                            styles.dayChipNumber,
                            selected ? styles.dayChipNumberSelected : null,
                          ]}
                        >
                          Day {index + 1}
                        </Text>
                        <Text
                          style={[
                            styles.dayChipWeekday,
                            selected ? styles.dayChipWeekdaySelected : null,
                          ]}
                        >
                          {chip.weekday}
                        </Text>
                        <Text
                          style={[
                            styles.dayChipDate,
                            selected ? styles.dayChipDateSelected : null,
                          ]}
                        >
                          {chip.monthDay}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {selectedDay ? (
                  <View style={styles.dayMeta}>
                    <Text style={styles.dayTitle}>
                      {selectedDay.label?.trim() ||
                        `Day ${(days.findIndex((day) => day.id === selectedDay.id) ?? 0) + 1}`}
                    </Text>
                    {selectedDay.destinationCity ? (
                      <Text style={styles.daySubtitle}>{selectedDay.destinationCity}</Text>
                    ) : null}
                  </View>
                ) : null}

                {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

                {selectedDay && selectedDay.activities.length === 0 ? (
                  <EmptyState
                    title="No plans for this day yet."
                    body={
                      canAdd
                        ? "Add an activity to start filling this day."
                        : "Owners and editors can add activities."
                    }
                  />
                ) : null}

                {selectedDay && selectedDay.activities.length > 0 ? (
                  <View style={styles.list}>
                    {selectedDay.activities.map((activity, index) => (
                      <ItineraryActivityCard
                        key={activity.id}
                        activity={activity}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canReorder={canReorder}
                        isFirst={index === 0}
                        isLast={index === selectedDay.activities.length - 1}
                        actionsDisabled={isMutating}
                        onEdit={() => onEditActivity(activity)}
                        onDelete={() => setPendingDelete(activity)}
                        onMoveUp={() => {
                          void onMoveActivity(activity.id, "up");
                        }}
                        onMoveDown={() => {
                          void onMoveActivity(activity.id, "down");
                        }}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}

            <View style={styles.fabSpacer} />
          </>
        ) : null}
      </ScrollView>

      {canAdd && selectedDayId ? (
        <View style={styles.fabContainer}>
          <AppButton label="Add activity" onPress={onAddActivity} disabled={isMutating} />
        </View>
      ) : null}

      <ConfirmationDialog
        visible={pendingDelete != null}
        title="Delete activity?"
        message={
          pendingDelete
            ? `Remove “${pendingDelete.title}” from this day? This cannot be undone.`
            : ""
        }
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => {
          void onConfirmDelete();
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setPendingDelete(null);
          }
        }}
      />
    </SafeAreaView>
  );
}
