import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRecordTripSettlementMutation } from "@/features/expenses/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canRecordSettlement } from "@/features/trips/permissions";
import type { TripSummary } from "@/types/models";
import { toISODate } from "@/utils/date";
import { formatLocalDisplayDate, maskDisplayDateInput } from "@/utils/dateOnly";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  tripSettlementFormSchema,
  type TripSettlementFormInput,
  type TripSettlementFormValues,
} from "@/validation/settlementSchemas";
import { styles } from "./SettlementFormScreen.styles";

function emptyDefaults(trip: TripSummary, currentUserId: string | undefined): TripSettlementFormInput {
  const payer = currentUserId ?? trip.members[0]?.profile.id ?? "";
  const fallbackPayee = trip.members.find((member) => member.profile.id !== payer)?.profile.id ?? "";
  return {
    payerId: payer,
    payeeId: fallbackPayee,
    amount: "",
    currencyCode: trip.currency,
    settlementDate: formatLocalDisplayDate(toISODate(new Date())),
    notes: null,
  };
}

export function SettlementFormScreen() {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{ tripId?: string | string[] }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad = authIsReady && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const canSubmit = canRecordSettlement(role);

  const recordMutation = useRecordTripSettlementMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isLoading = shouldLoad && tripQuery.isLoading;
  const loadError = shouldLoad && tripQuery.isError;
  const showInvalidParams = !isPreviewActive && !hasValidTripId;

  const defaultValues: TripSettlementFormInput | null = trip
    ? emptyDefaults(trip, user?.id)
    : null;

  const form = useForm<TripSettlementFormInput, unknown, TripSettlementFormValues>({
    resolver: zodResolver(tripSettlementFormSchema),
    defaultValues: defaultValues ?? {
      payerId: "",
      payeeId: "",
      amount: "",
      currencyCode: "",
      settlementDate: "",
      notes: null,
    },
    mode: "onSubmit",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tripId || recordMutation.isPending) {
      return;
    }
    setSubmitError(null);
    try {
      await recordMutation.mutateAsync({ tripId, ...values });
      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to record settlement.");
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Record settlement"
        subtitle="Log a payment between trip members"
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
            body="This settlement link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to record settlements."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading trip…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load trip"
            message={
              tripQuery.error instanceof Error ? tripQuery.error.message : "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && !loadError && !isLoading && !canSubmit ? (
          <EmptyState
            title="View only"
            body="Only owners and editors can record settlements."
          />
        ) : null}

        {shouldLoad && trip && !loadError && !isLoading && canSubmit && tripId ? (
          <View style={styles.form}>
            <Controller
              control={form.control}
              name="payerId"
              render={({ field: { onChange, value }, fieldState }) => (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Who paid</Text>
                  <View style={styles.chipRow}>
                    {trip.members.map((member) => {
                      const selected = value === member.profile.id;
                      return (
                        <Pressable
                          key={member.profile.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          disabled={recordMutation.isPending}
                          onPress={() => onChange(member.profile.id)}
                          style={[styles.chip, selected ? styles.chipSelected : null]}
                        >
                          <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                            {member.profile.displayName}
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
              name="payeeId"
              render={({ field: { onChange, value }, fieldState }) => (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Who received it</Text>
                  <View style={styles.chipRow}>
                    {trip.members.map((member) => {
                      const selected = value === member.profile.id;
                      return (
                        <Pressable
                          key={member.profile.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          disabled={recordMutation.isPending}
                          onPress={() => onChange(member.profile.id)}
                          style={[styles.chip, selected ? styles.chipSelected : null]}
                        >
                          <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                            {member.profile.displayName}
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

            <View style={styles.row}>
              <Controller
                control={form.control}
                name="amount"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.rowItem}>
                    <AppTextInput
                      label="Amount"
                      placeholder="0.00"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                      editable={!recordMutation.isPending}
                      keyboardType="decimal-pad"
                    />
                  </View>
                )}
              />
              <Controller
                control={form.control}
                name="currencyCode"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <View style={styles.rowItem}>
                    <AppTextInput
                      label="Currency"
                      placeholder="USD"
                      value={value}
                      onChangeText={(text) => onChange(text.toUpperCase())}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                      editable={!recordMutation.isPending}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={3}
                    />
                  </View>
                )}
              />
            </View>

            <Controller
              control={form.control}
              name="settlementDate"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <AppTextInput
                  label="Date"
                  placeholder="DD/MM/YYYY"
                  value={value}
                  onChangeText={(text) => onChange(maskDisplayDateInput(text))}
                  onBlur={onBlur}
                  errorText={fieldState.error?.message}
                  editable={!recordMutation.isPending}
                  keyboardType="number-pad"
                />
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <AppTextInput
                  label="Notes"
                  placeholder="Optional notes"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorText={fieldState.error?.message}
                  editable={!recordMutation.isPending}
                  multiline
                />
              )}
            />

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

            <View style={styles.actions}>
              <AppButton
                label={recordMutation.isPending ? "Recording…" : "Record settlement"}
                onPress={() => {
                  void onSubmit();
                }}
                loading={recordMutation.isPending}
                disabled={recordMutation.isPending}
              />
              <AppButton
                label="Cancel"
                variant="secondary"
                onPress={() => router.back()}
                disabled={recordMutation.isPending}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
