import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
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
import {
  defaultSelectedDayId,
  formatDayChipParts,
} from "@/features/itinerary/daySelection";
import {
  useCreateTripActivityMutation,
  useTripActivityQuery,
  useTripItineraryQuery,
  useUpdateTripActivityMutation,
} from "@/features/itinerary/hooks";
import type {
  CreateTripActivityInput,
  UpdateTripActivityInput,
} from "@/features/itinerary/api";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canCreateActivity, canEditActivity } from "@/features/trips/permissions";
import { colors } from "@/theme";
import type {
  TripActivity,
  TripActivityCategory,
  TripDayWithActivities,
  TripDestination,
} from "@/types/models";
import { toISODate } from "@/utils/date";
import {
  getTripActivityCategoryLabel,
  TRIP_ACTIVITY_CATEGORIES,
} from "@/utils/itineraryCategory";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  tripActivityFormSchema,
  type TripActivityFormInput,
  type TripActivityFormValues,
} from "@/validation/activitySchemas";
import { styles } from "./ActivityFormScreen.styles";

export type ActivityFormMode = "create" | "edit";

export interface ActivityFormScreenProps {
  mode: ActivityFormMode;
}

const emptyDefaults: TripActivityFormInput = {
  title: "",
  category: "activity",
  tripDayId: "00000000-0000-4000-8000-000000000000",
  destinationId: null,
  isAllDay: false,
  startTime: null,
  endTime: null,
  locationName: null,
  address: null,
  geoapifyPlaceId: null,
  latitude: null,
  longitude: null,
  description: null,
  notes: null,
};

interface ActivityFormFieldsProps {
  mode: ActivityFormMode;
  tripId: string;
  activityId: string | undefined;
  days: TripDayWithActivities[];
  destinations: TripDestination[];
  defaultValues: TripActivityFormInput;
  hasValidActivityId: boolean;
  createMutation: UseMutationResult<TripActivity, Error, CreateTripActivityInput>;
  updateMutation: UseMutationResult<TripActivity, Error, UpdateTripActivityInput>;
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  onSuccess: () => void;
  onCancel: () => void;
}

function ActivityFormFields({
  mode,
  tripId,
  activityId,
  days,
  destinations,
  defaultValues,
  hasValidActivityId,
  createMutation,
  updateMutation,
  isSubmitting,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: ActivityFormFieldsProps) {
  const form = useForm<TripActivityFormInput, unknown, TripActivityFormValues>({
    resolver: zodResolver(tripActivityFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const isAllDay = useWatch({ control: form.control, name: "isAllDay" });
  const destinationId = useWatch({ control: form.control, name: "destinationId" });
  const locationName = useWatch({ control: form.control, name: "locationName" });
  const address = useWatch({ control: form.control, name: "address" });
  const geoapifyPlaceId = useWatch({ control: form.control, name: "geoapifyPlaceId" });
  const latitude = useWatch({ control: form.control, name: "latitude" });
  const longitude = useWatch({ control: form.control, name: "longitude" });

  const countryBias = useMemo(() => {
    const selected = destinations.find((destination) => destination.id === destinationId);
    if (selected?.countryCode) {
      return selected.countryCode;
    }
    return destinations[0]?.countryCode ?? null;
  }, [destinations, destinationId]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          tripId,
          tripDayId: values.tripDayId,
          destinationId: values.destinationId,
          title: values.title,
          description: values.description,
          category: values.category,
          isAllDay: values.isAllDay,
          startTime: values.startTime,
          endTime: values.endTime,
          locationName: values.locationName,
          address: values.address,
          geoapifyPlaceId: values.geoapifyPlaceId,
          latitude: values.latitude,
          longitude: values.longitude,
          notes: values.notes,
        });
      } else {
        if (!hasValidActivityId || !activityId) {
          setSubmitError("Activity not found.");
          return;
        }
        await updateMutation.mutateAsync({
          tripId,
          activityId,
          tripDayId: values.tripDayId,
          destinationId: values.destinationId,
          title: values.title,
          description: values.description,
          category: values.category,
          isAllDay: values.isAllDay,
          startTime: values.startTime,
          endTime: values.endTime,
          locationName: values.locationName,
          address: values.address,
          geoapifyPlaceId: values.geoapifyPlaceId,
          latitude: values.latitude,
          longitude: values.longitude,
          notes: values.notes,
        });
      }
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save activity.",
      );
    }
  });

  return (
    <View style={styles.form}>
      <Controller
        control={form.control}
        name="title"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Title"
            placeholder="Visit the market"
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
        name="category"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {TRIP_ACTIVITY_CATEGORIES.map((category: TripActivityCategory) => {
                const selected = value === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => onChange(category)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      {getTripActivityCategoryLabel(category)}
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
        name="tripDayId"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Day</Text>
            <View style={styles.chipRow}>
              {days.map((day, index) => {
                const selected = value === day.id;
                const chip = formatDayChipParts(day.date);
                return (
                  <Pressable
                    key={day.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => onChange(day.id)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      Day {index + 1} · {chip.weekday} {chip.monthDay}
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
        name="destinationId"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Destination (optional)</Text>
            <View style={styles.chipRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: value == null }}
                disabled={isSubmitting}
                onPress={() => onChange(null)}
                style={[styles.chip, value == null ? styles.chipSelected : null]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    value == null ? styles.chipLabelSelected : null,
                  ]}
                >
                  None
                </Text>
              </Pressable>
              {destinations.map((destination) => {
                const selected = value === destination.id;
                return (
                  <Pressable
                    key={destination.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => onChange(destination.id)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      {destination.city}
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
        name="isAllDay"
        render={({ field: { onChange, value } }) => (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>All day</Text>
            <Switch
              value={value}
              onValueChange={onChange}
              disabled={isSubmitting}
              trackColor={{ false: colors.borderStrong, true: colors.primaryBorder }}
              thumbColor={value ? colors.primary : colors.surface}
              accessibilityLabel="All day activity"
            />
          </View>
        )}
      />

      {!isAllDay ? (
        <>
          <Controller
            control={form.control}
            name="startTime"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
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
            )}
          />
          <Controller
            control={form.control}
            name="endTime"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
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
            )}
          />
        </>
      ) : null}

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
            countryCode={countryBias}
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

      <Controller
        control={form.control}
        name="description"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Description"
            placeholder="What are we doing?"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            multiline
          />
        )}
      />

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
                ? "Add activity"
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

export function ActivityFormScreen({ mode }: ActivityFormScreenProps) {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    activityId?: string | string[];
    dayId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const activityId = resolveRouteParam(localParams.activityId);
  const dayIdParam = resolveRouteParam(localParams.dayId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidActivityId = isValidUuid(activityId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    (mode === "create" || hasValidActivityId);

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const itineraryQuery = useTripItineraryQuery(tripId, shouldLoad && Boolean(tripQuery.data));
  const activityQuery = useTripActivityQuery(
    tripId,
    activityId,
    shouldLoad && mode === "edit" && Boolean(tripQuery.data),
  );

  const createMutation = useCreateTripActivityMutation();
  const updateMutation = useUpdateTripActivityMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const days = useMemo(() => itineraryQuery.data ?? [], [itineraryQuery.data]);
  const destinations = trip?.destinations ?? [];
  const activity = activityQuery.data ?? null;

  const canSubmit =
    mode === "create" ? canCreateActivity(role) : canEditActivity(role);

  const resolvedCreateDayId = useMemo(() => {
    if (dayIdParam && days.some((day) => day.id === dayIdParam)) {
      return dayIdParam;
    }
    return defaultSelectedDayId(days, toISODate(new Date()));
  }, [dayIdParam, days]);

  const formDefaults: TripActivityFormInput | null = useMemo(() => {
    if (mode === "create") {
      if (!resolvedCreateDayId) {
        return null;
      }
      return {
        ...emptyDefaults,
        tripDayId: resolvedCreateDayId,
      };
    }
    if (!activity) {
      return null;
    }
    return {
      title: activity.title,
      category: activity.category,
      tripDayId: activity.tripDayId,
      destinationId: activity.destinationId,
      isAllDay: activity.isAllDay,
      startTime: activity.startTime,
      endTime: activity.endTime,
      locationName: activity.locationName,
      address: activity.address,
      geoapifyPlaceId: activity.geoapifyPlaceId,
      latitude: activity.latitude,
      longitude: activity.longitude,
      description: activity.description,
      notes: activity.notes,
    };
  }, [mode, resolvedCreateDayId, activity]);

  const formKey =
    mode === "create"
      ? `create-${resolvedCreateDayId ?? "pending"}`
      : `edit-${activity?.id ?? "pending"}`;

  const isLoading =
    shouldLoad &&
    (tripQuery.isLoading ||
      itineraryQuery.isLoading ||
      (mode === "edit" && activityQuery.isLoading));

  const loadError =
    shouldLoad &&
    (tripQuery.isError ||
      itineraryQuery.isError ||
      (mode === "edit" && activityQuery.isError));

  const showNoDays =
    shouldLoad &&
    trip &&
    !loadError &&
    !isLoading &&
    mode === "create" &&
    days.length === 0;

  const showActivityMissing =
    shouldLoad &&
    trip &&
    !loadError &&
    !isLoading &&
    mode === "edit" &&
    activity == null;

  const showInvalidParams =
    !isPreviewActive &&
    (!hasValidTripId || (mode === "edit" && !hasValidActivityId));

  const title = mode === "create" ? "New activity" : "Edit activity";
  const subtitle = mode === "create" ? "Add to the itinerary" : "Update activity details";

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
            body="This activity link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to create or edit activities."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading activity…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (itineraryQuery.error instanceof Error && itineraryQuery.error.message) ||
              (activityQuery.error instanceof Error && activityQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              void itineraryQuery.refetch();
              if (mode === "edit") {
                void activityQuery.refetch();
              }
            }}
          />
        ) : null}

        {showNoDays ? (
          <EmptyState
            title="No days yet"
            body="Trip days appear after the trip dates are set."
          />
        ) : null}

        {showActivityMissing ? (
          <EmptyState
            title="Activity not found"
            body="This activity may have been deleted or is not part of this trip."
          />
        ) : null}

        {shouldLoad &&
        trip &&
        !loadError &&
        !isLoading &&
        formDefaults &&
        canSubmit &&
        tripId ? (
          <ActivityFormFields
            key={formKey}
            mode={mode}
            tripId={tripId}
            activityId={activityId}
            days={days}
            destinations={destinations}
            defaultValues={formDefaults}
            hasValidActivityId={hasValidActivityId}
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
            body="Only owners and editors can add or edit activities."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
