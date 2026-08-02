import { useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { PlaceAutocompleteField } from "@/components/ui/PlaceAutocompleteField";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import type {
  CreateTripBookingInput,
  UpdateTripBookingInput,
} from "@/features/bookings/api";
import {
  useCreateTripBookingMutation,
  useTripBookingQuery,
  useUpdateTripBookingMutation,
} from "@/features/bookings/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canCreateBooking, canEditBooking } from "@/features/trips/permissions";
import type { TripBooking, TripBookingType } from "@/types/models";
import {
  getTripBookingTypeLabel,
  showsCheckInOut,
  showsTerminalGate,
  TRIP_BOOKING_TYPES,
  usesPlaceFields,
  usesTransitFields,
} from "@/utils/bookingType";
import { formatLocalDisplayDate, maskDisplayDateInput } from "@/utils/dateOnly";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  tripBookingFormSchema,
  type TripBookingFormInput,
  type TripBookingFormValues,
} from "@/validation/bookingSchemas";
import { styles } from "./BookingFormScreen.styles";

export type BookingFormMode = "create" | "edit";

export interface BookingFormScreenProps {
  mode: BookingFormMode;
}

const emptyDefaults: TripBookingFormInput = {
  bookingType: "accommodation",
  title: "",
  providerName: null,
  confirmationNumber: null,
  bookingReference: null,
  status: null,
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null,
  locationName: null,
  address: null,
  geoapifyPlaceId: null,
  latitude: null,
  longitude: null,
  departureLocation: null,
  arrivalLocation: null,
  carrierName: null,
  transportNumber: null,
  terminal: null,
  gate: null,
  checkInTime: null,
  checkOutTime: null,
  notes: null,
};

function toFormDefaults(booking: TripBooking): TripBookingFormInput {
  return {
    bookingType: booking.bookingType,
    title: booking.title,
    providerName: booking.providerName,
    confirmationNumber: booking.confirmationNumber,
    bookingReference: booking.bookingReference,
    status: booking.status,
    startDate: booking.startDate ? formatLocalDisplayDate(booking.startDate) : null,
    startTime: booking.startTime,
    endDate: booking.endDate ? formatLocalDisplayDate(booking.endDate) : null,
    endTime: booking.endTime,
    locationName: booking.locationName,
    address: booking.address,
    geoapifyPlaceId: booking.geoapifyPlaceId,
    latitude: booking.latitude,
    longitude: booking.longitude,
    departureLocation: booking.departureLocation,
    arrivalLocation: booking.arrivalLocation,
    carrierName: booking.carrierName,
    transportNumber: booking.transportNumber,
    terminal: booking.terminal,
    gate: booking.gate,
    checkInTime: booking.checkInTime,
    checkOutTime: booking.checkOutTime,
    notes: booking.notes,
  };
}

interface BookingFormFieldsProps {
  mode: BookingFormMode;
  tripId: string;
  bookingId: string | undefined;
  defaultValues: TripBookingFormInput;
  hasValidBookingId: boolean;
  createMutation: UseMutationResult<TripBooking, Error, CreateTripBookingInput>;
  updateMutation: UseMutationResult<TripBooking, Error, UpdateTripBookingInput>;
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  onSuccess: () => void;
  onCancel: () => void;
}

function BookingFormFields({
  mode,
  tripId,
  bookingId,
  defaultValues,
  hasValidBookingId,
  createMutation,
  updateMutation,
  isSubmitting,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: BookingFormFieldsProps) {
  const form = useForm<TripBookingFormInput, unknown, TripBookingFormValues>({
    resolver: zodResolver(tripBookingFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const bookingType = useWatch({ control: form.control, name: "bookingType" });
  const locationName = useWatch({ control: form.control, name: "locationName" });
  const address = useWatch({ control: form.control, name: "address" });
  const geoapifyPlaceId = useWatch({ control: form.control, name: "geoapifyPlaceId" });
  const latitude = useWatch({ control: form.control, name: "latitude" });
  const longitude = useWatch({ control: form.control, name: "longitude" });

  const showPlaceFields = usesPlaceFields(bookingType);
  const showTransitFields = usesTransitFields(bookingType);
  const showTerminalGate = showsTerminalGate(bookingType);
  const showCheckInOut = showsCheckInOut(bookingType);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    try {
      const shared = {
        bookingType: values.bookingType,
        title: values.title,
        providerName: values.providerName,
        confirmationNumber: values.confirmationNumber,
        bookingReference: values.bookingReference,
        status: values.status,
        startDate: values.startDate,
        startTime: values.startTime,
        endDate: values.endDate,
        endTime: values.endTime,
        locationName: values.locationName,
        address: values.address,
        geoapifyPlaceId: values.geoapifyPlaceId,
        latitude: values.latitude,
        longitude: values.longitude,
        departureLocation: values.departureLocation,
        arrivalLocation: values.arrivalLocation,
        carrierName: values.carrierName,
        transportNumber: values.transportNumber,
        terminal: values.terminal,
        gate: values.gate,
        checkInTime: values.checkInTime,
        checkOutTime: values.checkOutTime,
        notes: values.notes,
      };

      if (mode === "create") {
        await createMutation.mutateAsync({ tripId, ...shared });
      } else {
        if (!hasValidBookingId || !bookingId) {
          setSubmitError("Booking not found.");
          return;
        }
        await updateMutation.mutateAsync({ tripId, bookingId, ...shared });
      }
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save booking.",
      );
    }
  });

  return (
    <View style={styles.form}>
      <Controller
        control={form.control}
        name="bookingType"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Booking type</Text>
            <View style={styles.chipRow}>
              {TRIP_BOOKING_TYPES.map((type: TripBookingType) => {
                const selected = value === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => onChange(type)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      {getTripBookingTypeLabel(type)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {fieldState.error ? (
              <Text style={styles.fieldError}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="title"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Title"
            placeholder="Hotel Amara"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            autoCapitalize="sentences"
          />
        )}
      />

      <Controller
        control={form.control}
        name="providerName"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Provider (optional)"
            placeholder="Airline, hotel, or company name"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            autoCapitalize="words"
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={form.control}
          name="confirmationNumber"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="Confirmation number"
                placeholder="ABC123"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                autoCapitalize="characters"
              />
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="bookingReference"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="Booking reference"
                placeholder="Optional"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                autoCapitalize="characters"
              />
            </View>
          )}
        />
      </View>

      <Controller
        control={form.control}
        name="status"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Status (optional)"
            placeholder="Confirmed, pending, cancelled…"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            autoCapitalize="sentences"
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={form.control}
          name="startDate"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="Start date"
                placeholder="DD/MM/YYYY"
                value={value ?? ""}
                onChangeText={(text) => onChange(maskDisplayDateInput(text))}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                keyboardType="number-pad"
              />
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="startTime"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="Start time"
                placeholder="HH:mm"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.row}>
        <Controller
          control={form.control}
          name="endDate"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="End date"
                placeholder="DD/MM/YYYY"
                value={value ?? ""}
                onChangeText={(text) => onChange(maskDisplayDateInput(text))}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                keyboardType="number-pad"
              />
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="endTime"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <View style={styles.rowItem}>
              <AppTextInput
                label="End time"
                placeholder="HH:mm"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                editable={!isSubmitting}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        />
      </View>

      {showPlaceFields ? (
        <Controller
          control={form.control}
          name="locationName"
          render={({ fieldState }) => (
            <PlaceAutocompleteField
              label="Location"
              value={locationName ?? ""}
              address={address ?? ""}
              geoapifyPlaceId={geoapifyPlaceId ?? null}
              latitude={latitude ?? null}
              longitude={longitude ?? null}
              language="en"
              errorText={fieldState.error?.message}
              disabled={isSubmitting}
              onManualTextChange={({ locationName: nextName, address: nextAddress, clearProviderMetadata }) => {
                form.setValue("locationName", nextName, {
                  shouldDirty: true,
                  shouldValidate: false,
                });
                if (nextAddress !== undefined) {
                  form.setValue("address", nextAddress, {
                    shouldDirty: true,
                    shouldValidate: false,
                  });
                }
                if (clearProviderMetadata) {
                  form.setValue("geoapifyPlaceId", null, { shouldDirty: true });
                  form.setValue("latitude", null, { shouldDirty: true });
                  form.setValue("longitude", null, { shouldDirty: true });
                }
              }}
              onPlaceSelected={(suggestion) => {
                form.setValue("locationName", suggestion.name, {
                  shouldDirty: true,
                  shouldValidate: false,
                });
                form.setValue("address", suggestion.formattedAddress, {
                  shouldDirty: true,
                  shouldValidate: false,
                });
                form.setValue("geoapifyPlaceId", suggestion.placeId, {
                  shouldDirty: true,
                });
                form.setValue("latitude", suggestion.latitude, { shouldDirty: true });
                form.setValue("longitude", suggestion.longitude, { shouldDirty: true });
              }}
              onClearSelection={() => {
                form.setValue("locationName", null, { shouldDirty: true });
                form.setValue("address", null, { shouldDirty: true });
                form.setValue("geoapifyPlaceId", null, { shouldDirty: true });
                form.setValue("latitude", null, { shouldDirty: true });
                form.setValue("longitude", null, { shouldDirty: true });
              }}
            />
          )}
        />
      ) : null}

      {showTransitFields ? (
        <>
          <View style={styles.row}>
            <Controller
              control={form.control}
              name="departureLocation"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View style={styles.rowItem}>
                  <AppTextInput
                    label="Departure"
                    placeholder="From"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="arrivalLocation"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View style={styles.rowItem}>
                  <AppTextInput
                    label="Arrival"
                    placeholder="To"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
          </View>

          <View style={styles.row}>
            <Controller
              control={form.control}
              name="carrierName"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View style={styles.rowItem}>
                  <AppTextInput
                    label="Carrier"
                    placeholder="Airline, operator…"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            <Controller
              control={form.control}
              name="transportNumber"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View style={styles.rowItem}>
                  <AppTextInput
                    label="Number"
                    placeholder="Flight / train / booking #"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                    autoCapitalize="characters"
                  />
                </View>
              )}
            />
          </View>

          {showTerminalGate ? (
            <View style={styles.row}>
              <Controller
                control={form.control}
                name="terminal"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.rowItem}>
                    <AppTextInput
                      label="Terminal"
                      placeholder="Optional"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                      editable={!isSubmitting}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              />
              <Controller
                control={form.control}
                name="gate"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.rowItem}>
                    <AppTextInput
                      label="Gate"
                      placeholder="Optional"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                      editable={!isSubmitting}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {showCheckInOut ? (
        <View style={styles.row}>
          <Controller
            control={form.control}
            name="checkInTime"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <View style={styles.rowItem}>
                <AppTextInput
                  label="Check-in time"
                  placeholder="HH:mm"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={fieldState.error?.message}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          />
          <Controller
            control={form.control}
            name="checkOutTime"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <View style={styles.rowItem}>
                <AppTextInput
                  label="Check-out time"
                  placeholder="HH:mm"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={fieldState.error?.message}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          />
        </View>
      ) : null}

      <Controller
        control={form.control}
        name="notes"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Notes"
            placeholder="Private planning notes"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            multiline
          />
        )}
      />

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <View style={styles.actions}>
        <AppButton
          label={
            isSubmitting
              ? mode === "create"
                ? "Adding…"
                : "Saving…"
              : mode === "create"
                ? "Add booking"
                : "Save changes"
          }
          onPress={() => {
            void onSubmit();
          }}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
        <AppButton
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          disabled={isSubmitting}
        />
      </View>
    </View>
  );
}

export function BookingFormScreen({ mode }: BookingFormScreenProps) {
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
    (mode === "create" || hasValidBookingId);

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const bookingQuery = useTripBookingQuery(
    tripId,
    bookingId,
    shouldLoad && mode === "edit" && Boolean(tripQuery.data),
  );

  const createMutation = useCreateTripBookingMutation();
  const updateMutation = useUpdateTripBookingMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const booking = bookingQuery.data ?? null;

  const canSubmit =
    mode === "create" ? canCreateBooking(role) : canEditBooking(role);

  const formDefaults: TripBookingFormInput | null =
    mode === "create" ? emptyDefaults : booking ? toFormDefaults(booking) : null;

  const formKey =
    mode === "create" ? "create-booking" : `edit-${booking?.id ?? "pending"}`;

  const isLoading =
    shouldLoad &&
    (tripQuery.isLoading || (mode === "edit" && bookingQuery.isLoading));

  const loadError =
    shouldLoad &&
    (tripQuery.isError || (mode === "edit" && bookingQuery.isError));

  const showBookingMissing =
    shouldLoad &&
    trip &&
    !loadError &&
    !isLoading &&
    mode === "edit" &&
    booking == null;

  const showInvalidParams =
    !isPreviewActive &&
    (!hasValidTripId || (mode === "edit" && !hasValidBookingId));

  const title = mode === "create" ? "New booking" : "Edit booking";
  const subtitle = mode === "create" ? "Add a reservation" : "Update booking details";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showInvalidParams ? (
          <EmptyState
            title="Trip not found"
            body="This booking link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to create or edit bookings."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading booking…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (bookingQuery.error instanceof Error && bookingQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              if (mode === "edit") {
                void bookingQuery.refetch();
              }
            }}
          />
        ) : null}

        {showBookingMissing ? (
          <EmptyState
            title="Booking not found"
            body="This booking may have been deleted or is not part of this trip."
          />
        ) : null}

        {shouldLoad &&
        trip &&
        !loadError &&
        !isLoading &&
        formDefaults &&
        canSubmit &&
        tripId ? (
          <BookingFormFields
            key={formKey}
            mode={mode}
            tripId={tripId}
            bookingId={bookingId}
            defaultValues={formDefaults}
            hasValidBookingId={hasValidBookingId}
            createMutation={createMutation}
            updateMutation={updateMutation}
            isSubmitting={isSubmitting}
            submitError={submitError}
            setSubmitError={setSubmitError}
            onSuccess={() => router.back()}
            onCancel={() => router.back()}
          />
        ) : null}

        {shouldLoad && trip && !loadError && !isLoading && formDefaults && !canSubmit ? (
          <EmptyState
            title="View only"
            body="Only owners and editors can add or edit bookings."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
