import { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { defaultSelectedDayId, formatDayChipParts } from "@/features/itinerary/daySelection";
import { useTripItineraryQuery } from "@/features/itinerary/hooks";
import { useTripIdeaQuery, usePromoteTripIdeaMutation } from "@/features/ideas/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canPromoteIdea } from "@/features/trips/permissions";
import { colors } from "@/theme";
import type { TripDayWithActivities, TripDestination } from "@/types/models";
import { getTripIdeaCategoryLabel } from "@/utils/ideaCategory";
import { toISODate } from "@/utils/date";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  promoteIdeaSchema,
  type PromoteIdeaFormInput,
  type PromoteIdeaFormValues,
} from "@/validation/ideaSchemas";
import { styles } from "./AddIdeaToItineraryScreen.styles";

interface PromoteIdeaFieldsProps {
  tripId: string;
  ideaId: string;
  ideaTitle: string;
  ideaCategoryLabel: string;
  days: TripDayWithActivities[];
  destinations: TripDestination[];
  defaultValues: PromoteIdeaFormInput;
  promoteMutation: ReturnType<typeof usePromoteTripIdeaMutation>;
  submitError: string | null;
  setSubmitError: (value: string | null) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

function PromoteIdeaFields({
  tripId,
  ideaId,
  ideaTitle,
  ideaCategoryLabel,
  days,
  destinations,
  defaultValues,
  promoteMutation,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: PromoteIdeaFieldsProps) {
  const form = useForm<PromoteIdeaFormInput, unknown, PromoteIdeaFormValues>({
    resolver: zodResolver(promoteIdeaSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const isAllDay = useWatch({ control: form.control, name: "isAllDay" });
  const isSubmitting = promoteMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }
    setSubmitError(null);
    try {
      await promoteMutation.mutateAsync({
        tripId,
        ideaId,
        tripDayId: values.tripDayId,
        destinationId: values.destinationId,
        isAllDay: values.isAllDay,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes,
      });
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to add this idea to the itinerary.",
      );
    }
  });

  return (
    <View style={styles.form}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{ideaTitle}</Text>
        <Text style={styles.summaryMeta}>{ideaCategoryLabel}</Text>
      </View>

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
          label={isSubmitting ? "Adding…" : "Add to itinerary"}
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

export function AddIdeaToItineraryScreen() {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    ideaId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const ideaId = resolveRouteParam(localParams.ideaId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidIdeaId = isValidUuid(ideaId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const shouldLoad =
    !isInitializing &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    hasValidIdeaId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const ideaQuery = useTripIdeaQuery(tripId, ideaId, user?.id, shouldLoad && Boolean(tripQuery.data));
  const itineraryQuery = useTripItineraryQuery(tripId, shouldLoad && Boolean(tripQuery.data));

  const promoteMutation = usePromoteTripIdeaMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const idea = ideaQuery.data ?? null;
  const days = useMemo(() => itineraryQuery.data ?? [], [itineraryQuery.data]);
  const destinations = trip?.destinations ?? [];

  const canSubmit = canPromoteIdea(role);
  const alreadyPromoted = idea != null && idea.status !== "proposed";

  const defaultDayId = useMemo(
    () => defaultSelectedDayId(days, toISODate(new Date())),
    [days],
  );

  const defaultValues: PromoteIdeaFormInput | null = useMemo(() => {
    if (!idea || !defaultDayId) {
      return null;
    }
    return {
      tripDayId: defaultDayId,
      destinationId: idea.destinationId,
      isAllDay: true,
      startTime: null,
      endTime: null,
      notes: null,
    };
  }, [idea, defaultDayId]);

  const isLoading =
    shouldLoad && (tripQuery.isLoading || ideaQuery.isLoading || itineraryQuery.isLoading);
  const loadError =
    shouldLoad && (tripQuery.isError || ideaQuery.isError || itineraryQuery.isError);
  const showInvalidParams = !isPreviewActive && (!hasValidTripId || !hasValidIdeaId);
  const showIdeaMissing = shouldLoad && trip && !loadError && !isLoading && idea == null;
  const showNoDays =
    shouldLoad && trip && idea && !loadError && !isLoading && days.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Add to itinerary"
        subtitle="Choose a day for this idea"
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
            title="Idea not found"
            body="This link is missing a valid trip or idea id. Go back and try again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to add ideas to the itinerary."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading idea…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (ideaQuery.error instanceof Error && ideaQuery.error.message) ||
              (itineraryQuery.error instanceof Error && itineraryQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              void ideaQuery.refetch();
              void itineraryQuery.refetch();
            }}
          />
        ) : null}

        {showIdeaMissing ? (
          <EmptyState
            title="Idea not found"
            body="This idea may have been deleted or is not part of this trip."
          />
        ) : null}

        {showNoDays ? (
          <EmptyState title="No days yet" body="Trip days appear after the trip dates are set." />
        ) : null}

        {shouldLoad && trip && idea && !canSubmit ? (
          <EmptyState
            title="View only"
            body="Only owners and editors can add ideas to the itinerary."
          />
        ) : null}

        {shouldLoad && trip && idea && canSubmit && alreadyPromoted ? (
          <EmptyState
            title={idea.status === "archived" ? "Idea archived" : "Already added"}
            body={
              idea.status === "archived"
                ? "Archived ideas cannot be added to the itinerary."
                : "This idea has already been added to the itinerary."
            }
          />
        ) : null}

        {shouldLoad &&
        trip &&
        idea &&
        !loadError &&
        !isLoading &&
        !showNoDays &&
        canSubmit &&
        !alreadyPromoted &&
        defaultValues &&
        tripId ? (
          <PromoteIdeaFields
            key={idea.id}
            tripId={tripId}
            ideaId={idea.id}
            ideaTitle={idea.title}
            ideaCategoryLabel={getTripIdeaCategoryLabel(idea.category)}
            days={days}
            destinations={destinations}
            defaultValues={defaultValues}
            promoteMutation={promoteMutation}
            submitError={submitError}
            setSubmitError={setSubmitError}
            onSuccess={() => router.back()}
            onCancel={() => router.back()}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
