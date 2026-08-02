import { useState, type Dispatch, type SetStateAction } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutationResult } from "@tanstack/react-query";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import type { CreateTripExpenseInput, UpdateTripExpenseInput } from "@/features/expenses/api";
import {
  useCreateTripExpenseMutation,
  useTripExpenseQuery,
  useUpdateTripExpenseMutation,
} from "@/features/expenses/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canManageExpenses } from "@/features/trips/permissions";
import type { TripExpense, TripSummary } from "@/types/models";
import { toISODate } from "@/utils/date";
import { formatLocalDisplayDate, maskDisplayDateInput } from "@/utils/dateOnly";
import {
  getSplitMethodLabel,
  getTripExpenseCategoryLabel,
  TRIP_EXPENSE_CATEGORIES,
  TRIP_EXPENSE_SPLIT_METHODS,
} from "@/utils/expenseCategory";
import { fromMinorUnits } from "@/utils/money";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  tripExpenseFormSchema,
  type TripExpenseFormInput,
  type TripExpenseFormValues,
} from "@/validation/expenseSchemas";
import { styles } from "./ExpenseFormScreen.styles";

export type ExpenseFormMode = "create" | "edit";

export interface ExpenseFormScreenProps {
  mode: ExpenseFormMode;
}

function emptyDefaults(trip: TripSummary, currentUserId: string | undefined): TripExpenseFormInput {
  return {
    title: "",
    category: "other",
    amount: "",
    currencyCode: trip.currency,
    expenseDate: formatLocalDisplayDate(toISODate(new Date())),
    paidBy: currentUserId ?? trip.members[0]?.profile.id ?? "",
    splitMethod: "equal",
    participants: trip.members.map((member) => ({
      userId: member.profile.id,
      shareAmount: "",
      sharePercentage: "",
    })),
    notes: null,
  };
}

function toFormDefaults(expense: TripExpense): TripExpenseFormInput {
  return {
    title: expense.title,
    category: expense.category,
    amount: String(fromMinorUnits(expense.amountMinor, expense.currencyCode)),
    currencyCode: expense.currencyCode,
    expenseDate: formatLocalDisplayDate(expense.expenseDate),
    paidBy: expense.paidBy,
    splitMethod: expense.splitMethod,
    participants: expense.splits.map((split) => ({
      userId: split.userId,
      shareAmount:
        split.shareAmountMinor != null
          ? String(fromMinorUnits(split.shareAmountMinor, expense.currencyCode))
          : "",
      sharePercentage: split.sharePercentage != null ? String(split.sharePercentage) : "",
    })),
    notes: expense.notes,
  };
}

interface ExpenseFormFieldsProps {
  mode: ExpenseFormMode;
  tripId: string;
  expenseId: string | undefined;
  trip: TripSummary;
  defaultValues: TripExpenseFormInput;
  hasValidExpenseId: boolean;
  createMutation: UseMutationResult<TripExpense, Error, CreateTripExpenseInput>;
  updateMutation: UseMutationResult<TripExpense, Error, UpdateTripExpenseInput>;
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  onSuccess: () => void;
  onCancel: () => void;
}

function ExpenseFormFields({
  mode,
  tripId,
  expenseId,
  trip,
  defaultValues,
  hasValidExpenseId,
  createMutation,
  updateMutation,
  isSubmitting,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: ExpenseFormFieldsProps) {
  const form = useForm<TripExpenseFormInput, unknown, TripExpenseFormValues>({
    resolver: zodResolver(tripExpenseFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  const splitMethod = useWatch({ control: form.control, name: "splitMethod" });
  const participantsError = form.formState.errors.participants;
  const participantsErrorMessage =
    participantsError && !Array.isArray(participantsError) ? participantsError.message : undefined;

  const toggleParticipant = (userId: string) => {
    const index = fields.findIndex((field) => field.userId === userId);
    if (index >= 0) {
      remove(index);
    } else {
      append({ userId, shareAmount: "", sharePercentage: "" });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    try {
      const shared = {
        title: values.title,
        category: values.category,
        amountMinor: values.amountMinor,
        currencyCode: values.currencyCode,
        expenseDate: values.expenseDate,
        paidBy: values.paidBy,
        splitMethod: values.splitMethod,
        participants: values.participants,
        notes: values.notes,
      };

      if (mode === "create") {
        await createMutation.mutateAsync({ tripId, ...shared });
      } else {
        if (!hasValidExpenseId || !expenseId) {
          setSubmitError("Expense not found.");
          return;
        }
        await updateMutation.mutateAsync({ tripId, expenseId, ...shared });
      }
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save expense.");
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
            placeholder="Dinner at the harbor"
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
              {TRIP_EXPENSE_CATEGORIES.map((category) => {
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
                    <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                      {getTripExpenseCategoryLabel(category)}
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
                editable={!isSubmitting}
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
                editable={!isSubmitting}
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
        name="expenseDate"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Date"
            placeholder="DD/MM/YYYY"
            value={value}
            onChangeText={(text) => onChange(maskDisplayDateInput(text))}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
            keyboardType="number-pad"
          />
        )}
      />

      <Controller
        control={form.control}
        name="paidBy"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Paid by</Text>
            <View style={styles.chipRow}>
              {trip.members.map((member) => {
                const selected = value === member.profile.id;
                return (
                  <Pressable
                    key={member.profile.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
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
        name="splitMethod"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Split method</Text>
            <View style={styles.chipRow}>
              {TRIP_EXPENSE_SPLIT_METHODS.map((method) => {
                const selected = value === method;
                return (
                  <Pressable
                    key={method}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => onChange(method)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                      {getSplitMethodLabel(method)}
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

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Participants</Text>
        <View style={styles.chipRow}>
          {trip.members.map((member) => {
            const selected = fields.some((field) => field.userId === member.profile.id);
            return (
              <Pressable
                key={member.profile.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={isSubmitting}
                onPress={() => toggleParticipant(member.profile.id)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
                  {member.profile.displayName}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {participantsErrorMessage ? (
          <Text style={styles.fieldError}>{participantsErrorMessage}</Text>
        ) : null}
      </View>

      {splitMethod !== "equal"
        ? fields.map((field, index) => {
            const member = trip.members.find((candidate) => candidate.profile.id === field.userId);
            const fieldName =
              splitMethod === "exact"
                ? (`participants.${index}.shareAmount` as const)
                : (`participants.${index}.sharePercentage` as const);
            return (
              <View key={field.id} style={styles.row}>
                <Text style={[styles.chipLabel, styles.participantName]}>
                  {member?.profile.displayName ?? "Member"}
                </Text>
                <View style={styles.rowItem}>
                  <Controller
                    control={form.control}
                    name={fieldName}
                    render={({ field: { onChange, onBlur, value }, fieldState }) => (
                      <AppTextInput
                        placeholder={splitMethod === "exact" ? "0.00" : "0"}
                        value={value ?? ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        errorText={fieldState.error?.message}
                        editable={!isSubmitting}
                        keyboardType="decimal-pad"
                      />
                    )}
                  />
                </View>
              </View>
            );
          })
        : null}

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
                ? "Add expense"
                : "Save changes"
          }
          onPress={() => {
            void onSubmit();
          }}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
        <AppButton label="Cancel" variant="secondary" onPress={onCancel} disabled={isSubmitting} />
      </View>
    </View>
  );
}

export function ExpenseFormScreen({ mode }: ExpenseFormScreenProps) {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    expenseId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const expenseId = resolveRouteParam(localParams.expenseId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidExpenseId = isValidUuid(expenseId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    (mode === "create" || hasValidExpenseId);

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const expenseQuery = useTripExpenseQuery(
    tripId,
    expenseId,
    shouldLoad && mode === "edit" && Boolean(tripQuery.data),
  );

  const createMutation = useCreateTripExpenseMutation();
  const updateMutation = useUpdateTripExpenseMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const expense = expenseQuery.data ?? null;

  const canSubmit = canManageExpenses(role);

  const formDefaults: TripExpenseFormInput | null =
    mode === "create"
      ? trip
        ? emptyDefaults(trip, user?.id)
        : null
      : expense
        ? toFormDefaults(expense)
        : null;

  const formKey = mode === "create" ? "create-expense" : `edit-${expense?.id ?? "pending"}`;

  const isLoading =
    shouldLoad && (tripQuery.isLoading || (mode === "edit" && expenseQuery.isLoading));

  const loadError =
    shouldLoad && (tripQuery.isError || (mode === "edit" && expenseQuery.isError));

  const showExpenseMissing =
    shouldLoad && trip && !loadError && !isLoading && mode === "edit" && expense == null;

  const showInvalidParams =
    !isPreviewActive && (!hasValidTripId || (mode === "edit" && !hasValidExpenseId));

  const title = mode === "create" ? "New expense" : "Edit expense";
  const subtitle = mode === "create" ? "Add a shared expense" : "Update expense details";

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
            body="This expense link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to create or edit expenses."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading expense…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (expenseQuery.error instanceof Error && expenseQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              if (mode === "edit") {
                void expenseQuery.refetch();
              }
            }}
          />
        ) : null}

        {showExpenseMissing ? (
          <EmptyState
            title="Expense not found"
            body="This expense may have been deleted or is not part of this trip."
          />
        ) : null}

        {shouldLoad &&
        trip &&
        !loadError &&
        !isLoading &&
        formDefaults &&
        canSubmit &&
        tripId ? (
          <ExpenseFormFields
            key={formKey}
            mode={mode}
            tripId={tripId}
            expenseId={expenseId}
            trip={trip}
            defaultValues={formDefaults}
            hasValidExpenseId={hasValidExpenseId}
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
            body="Only owners and editors can add or edit expenses."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
