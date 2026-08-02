import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDeleteTripBookingMutation, useTripBookingQuery } from "@/features/bookings/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canDeleteBooking, canEditBooking } from "@/features/trips/permissions";
import { getTripBookingTypeColor, getTripBookingTypeLabel } from "@/utils/bookingType";
import { formatDisplayDate, formatTimeLabel } from "@/utils/date";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./BookingDetailScreen.styles";

interface CopyRowProps {
  label: string;
  value: string;
}

function CopyRow({ label, value }: CopyRowProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Copy ${label}`}
          style={styles.copyButton}
          onPress={() => {
            void onCopy();
          }}
        >
          <Text style={styles.copyButtonLabel}>{copied ? "Copied" : "Copy"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function dateTimeText(date: string | null, time: string | null): string | null {
  if (!date) {
    return null;
  }
  const dateLabel = formatDisplayDate(date);
  return time ? `${dateLabel} · ${formatTimeLabel(time)}` : dateLabel;
}

export function BookingDetailScreen() {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    bookingId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const bookingId = resolveRouteParam(localParams.bookingId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidBookingId = isValidUuid(bookingId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    hasValidBookingId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const bookingQuery = useTripBookingQuery(
    tripId,
    bookingId,
    shouldLoad && Boolean(tripQuery.data),
  );

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const booking = bookingQuery.data ?? null;

  const canEdit = !isPreviewActive && canEditBooking(role);
  const canDelete = !isPreviewActive && canDeleteBooking(role);

  const [pendingDelete, setPendingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const deleteMutation = useDeleteTripBookingMutation();

  const isLoading = shouldLoad && (tripQuery.isLoading || bookingQuery.isLoading);
  const loadError = shouldLoad && (tripQuery.isError || bookingQuery.isError);
  const showInvalidParams = !isPreviewActive && (!hasValidTripId || !hasValidBookingId);
  const showMissing =
    shouldLoad && trip && !loadError && !isLoading && booking == null;

  const onEdit = () => {
    if (!hasValidTripId || !hasValidBookingId || !tripId || !bookingId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/bookings/[bookingId]/edit",
      params: { tripId, bookingId },
    });
  };

  const onConfirmDelete = async () => {
    if (!hasValidTripId || !hasValidBookingId || !tripId || !bookingId) {
      setPendingDelete(false);
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({ tripId, bookingId });
      setPendingDelete(false);
      router.back();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete booking.",
      );
      setPendingDelete(false);
    }
  };

  const typeColor = booking ? getTripBookingTypeColor(booking.bookingType) : null;
  const typeLabel = booking ? getTripBookingTypeLabel(booking.bookingType) : null;
  const startLabel = booking ? dateTimeText(booking.startDate, booking.startTime) : null;
  const endLabel = booking ? dateTimeText(booking.endDate, booking.endTime) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Booking"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showInvalidParams ? (
          <EmptyState
            title="Booking not found"
            body="This booking link is missing a valid trip or booking id."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to view booking details."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading booking…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load booking"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (bookingQuery.error instanceof Error && bookingQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              void bookingQuery.refetch();
            }}
          />
        ) : null}

        {showMissing ? (
          <EmptyState
            title="Booking not found"
            body="This booking may have been deleted."
          />
        ) : null}

        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

        {shouldLoad && booking && typeColor && typeLabel ? (
          <View style={styles.card}>
            <View
              style={[styles.typeBadge, { backgroundColor: `${typeColor}1A` }]}
              accessibilityLabel={`Type ${typeLabel}`}
            >
              <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
              <Text style={[styles.typeLabel, { color: typeColor }]}>{typeLabel}</Text>
            </View>

            <Text style={styles.title}>{booking.title}</Text>

            {booking.providerName ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Provider</Text>
                <Text style={styles.value}>{booking.providerName}</Text>
              </View>
            ) : null}

            {booking.status ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <Text style={styles.value}>{booking.status}</Text>
              </View>
            ) : null}

            {startLabel ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Starts</Text>
                <Text style={styles.value}>{startLabel}</Text>
              </View>
            ) : null}

            {endLabel ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ends</Text>
                <Text style={styles.value}>{endLabel}</Text>
              </View>
            ) : null}

            {booking.locationName ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.value}>{booking.locationName}</Text>
                {booking.address ? (
                  <Text style={styles.notes}>{booking.address}</Text>
                ) : null}
              </View>
            ) : null}

            {booking.departureLocation ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Departure</Text>
                <Text style={styles.value}>{booking.departureLocation}</Text>
              </View>
            ) : null}

            {booking.arrivalLocation ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Arrival</Text>
                <Text style={styles.value}>{booking.arrivalLocation}</Text>
              </View>
            ) : null}

            {booking.carrierName || booking.transportNumber ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Carrier</Text>
                <Text style={styles.value}>
                  {[booking.carrierName, booking.transportNumber].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ) : null}

            {booking.terminal || booking.gate ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Terminal / Gate</Text>
                <Text style={styles.value}>
                  {[
                    booking.terminal ? `Terminal ${booking.terminal}` : null,
                    booking.gate ? `Gate ${booking.gate}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            ) : null}

            {booking.checkInTime || booking.checkOutTime ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Check-in / Check-out</Text>
                <Text style={styles.value}>
                  {[
                    booking.checkInTime ? `In ${formatTimeLabel(booking.checkInTime)}` : null,
                    booking.checkOutTime ? `Out ${formatTimeLabel(booking.checkOutTime)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            ) : null}

            {booking.confirmationNumber ? (
              <CopyRow label="Confirmation number" value={booking.confirmationNumber} />
            ) : null}

            {booking.bookingReference ? (
              <CopyRow label="Booking reference" value={booking.bookingReference} />
            ) : null}

            {booking.notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notes}>{booking.notes}</Text>
              </View>
            ) : null}

            {canEdit || canDelete ? (
              <View style={styles.actions}>
                {canEdit ? <AppButton label="Edit booking" onPress={onEdit} /> : null}
                {canDelete ? (
                  <AppButton
                    label="Delete booking"
                    variant="destructive"
                    onPress={() => setPendingDelete(true)}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={pendingDelete}
        title="Delete booking?"
        message={booking ? `Remove “${booking.title}” from this trip? This cannot be undone.` : ""}
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => {
          void onConfirmDelete();
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setPendingDelete(false);
          }
        }}
      />
    </SafeAreaView>
  );
}
