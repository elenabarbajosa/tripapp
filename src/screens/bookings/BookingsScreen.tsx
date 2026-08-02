import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { TripBookingCard } from "@/components/TripBookingCard/TripBookingCard";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";
import { getBookingErrorDebug } from "@/features/bookings/errors";
import { filterBookingsByType, splitUpcomingPastBookings, type BookingTypeFilter } from "@/features/bookings/filters";
import { useDeleteTripBookingMutation, useTripBookingsQuery } from "@/features/bookings/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canCreateBooking, canDeleteBooking, canEditBooking } from "@/features/trips/permissions";
import type { TripBooking } from "@/types/models";
import { getTripBookingTypeLabel, TRIP_BOOKING_TYPES } from "@/utils/bookingType";
import { toISODate } from "@/utils/date";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./BookingsScreen.styles";

const filterOptions: BookingTypeFilter[] = ["all", ...TRIP_BOOKING_TYPES];

function filterLabel(filter: BookingTypeFilter): string {
  return filter === "all" ? "All" : getTripBookingTypeLabel(filter);
}

export function BookingsScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { isAuthenticated, isInitializing, user } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const bookingsQuery = useTripBookingsQuery(tripId, shouldLoad && Boolean(tripQuery.data));

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);

  const canAdd = !isPreviewActive && canCreateBooking(role);
  const canEdit = !isPreviewActive && canEditBooking(role);
  const canDelete = !isPreviewActive && canDeleteBooking(role);

  const [typeFilter, setTypeFilter] = useState<BookingTypeFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<TripBooking | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const deleteMutation = useDeleteTripBookingMutation();

  const filtered = useMemo(
    () => filterBookingsByType(bookings, typeFilter),
    [bookings, typeFilter],
  );
  const { upcoming, past } = useMemo(
    () => splitUpcomingPastBookings(filtered, toISODate(new Date())),
    [filtered],
  );

  const onAddBooking = () => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/bookings/new",
      params: { tripId },
    });
  };

  const onOpenBooking = (booking: TripBooking) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/bookings/[bookingId]",
      params: { tripId, bookingId: booking.id },
    });
  };

  const onEditBooking = (booking: TripBooking) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/bookings/[bookingId]/edit",
      params: { tripId, bookingId: booking.id },
    });
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
        bookingId: pendingDelete.id,
      });
      setPendingDelete(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete booking.",
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
            body="This bookings link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Bookings preview"
            body="Sign in and open a live trip to track bookings and reservations."
          />
        ) : null}

        {shouldLoad && (tripQuery.isLoading || bookingsQuery.isLoading) ? (
          <LoadingState label="Loading bookings…" />
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

        {shouldLoad && !tripQuery.isError && bookingsQuery.isError ? (
          <ErrorState
            title="Could not load bookings"
            message={(() => {
              const readable =
                bookingsQuery.error instanceof Error
                  ? bookingsQuery.error.message
                  : "Try again in a moment.";
              if (!__DEV__) {
                return readable;
              }
              const debug = getBookingErrorDebug(bookingsQuery.error);
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
              void bookingsQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && !bookingsQuery.isError ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filterOptions.map((option) => {
                const selected = option === typeFilter;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setTypeFilter(option)}
                    style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        selected ? styles.filterChipLabelSelected : null,
                      ]}
                    >
                      {filterLabel(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            {bookings.length === 0 ? (
              <EmptyState
                title="No bookings yet"
                body={
                  canAdd
                    ? "Add flights, stays, and reservations to keep everything in one place."
                    : "Owners and editors can add bookings."
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No bookings match this filter"
                body="Try a different booking type."
              />
            ) : (
              <>
                {upcoming.length > 0 ? (
                  <View style={styles.list}>
                    <Text style={styles.sectionTitle}>Upcoming</Text>
                    {upcoming.map((booking) => (
                      <TripBookingCard
                        key={booking.id}
                        booking={booking}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        actionsDisabled={deleteMutation.isPending}
                        onPress={() => onOpenBooking(booking)}
                        onEdit={() => onEditBooking(booking)}
                        onDelete={() => setPendingDelete(booking)}
                      />
                    ))}
                  </View>
                ) : null}

                {past.length > 0 ? (
                  <View style={styles.list}>
                    <Text style={styles.sectionTitle}>Past</Text>
                    {past.map((booking) => (
                      <TripBookingCard
                        key={booking.id}
                        booking={booking}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        actionsDisabled={deleteMutation.isPending}
                        onPress={() => onOpenBooking(booking)}
                        onEdit={() => onEditBooking(booking)}
                        onDelete={() => setPendingDelete(booking)}
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

      {canAdd ? (
        <View style={styles.fabContainer}>
          <AppButton label="Add booking" onPress={onAddBooking} disabled={deleteMutation.isPending} />
        </View>
      ) : null}

      <ConfirmationDialog
        visible={pendingDelete != null}
        title="Delete booking?"
        message={
          pendingDelete
            ? `Remove “${pendingDelete.title}” from this trip? This cannot be undone.`
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
