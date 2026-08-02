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
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import type {
  CreatePackingItemInput,
  UpdatePackingItemInput,
} from "@/features/packing/api";
import {
  useCreatePackingItemMutation,
  useTripPackingQuery,
  useUpdatePackingItemMutation,
} from "@/features/packing/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canCreatePackingItem, canEditPackingItem } from "@/features/trips/permissions";
import type { TripMember, TripPackingItem } from "@/types/models";
import {
  getTripPackingCategoryLabel,
  getTripPackingScopeLabel,
  TRIP_PACKING_CATEGORIES,
  TRIP_PACKING_SCOPES,
} from "@/utils/packingCategory";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  packingItemFormSchema,
  type PackingItemFormInput,
  type PackingItemFormValues,
} from "@/validation/packingSchemas";
import { styles } from "./PackingFormScreen.styles";

export type PackingFormMode = "create" | "edit";

export interface PackingFormScreenProps {
  mode: PackingFormMode;
}

function emptyDefaults(userId: string | null | undefined): PackingItemFormInput {
  return {
    title: "",
    category: "other",
    scope: "shared",
    assignedTo: null,
    quantity: 1,
    notes: null,
  };
}

function toFormDefaults(item: TripPackingItem): PackingItemFormInput {
  return {
    title: item.title,
    category: item.category,
    scope: item.scope,
    assignedTo: item.assignedTo,
    quantity: item.quantity,
    notes: item.notes,
  };
}

interface PackingFormFieldsProps {
  mode: PackingFormMode;
  tripId: string;
  itemId: string | undefined;
  members: TripMember[];
  currentUserId: string | undefined;
  defaultValues: PackingItemFormInput;
  hasValidItemId: boolean;
  createMutation: UseMutationResult<TripPackingItem, Error, CreatePackingItemInput>;
  updateMutation: UseMutationResult<TripPackingItem, Error, UpdatePackingItemInput>;
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  onSuccess: () => void;
  onCancel: () => void;
}

function PackingFormFields({
  mode,
  tripId,
  itemId,
  members,
  currentUserId,
  defaultValues,
  hasValidItemId,
  createMutation,
  updateMutation,
  isSubmitting,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: PackingFormFieldsProps) {
  const form = useForm<PackingItemFormInput, unknown, PackingItemFormValues>({
    resolver: zodResolver(packingItemFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const scope = useWatch({ control: form.control, name: "scope" });

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    try {
      const shared = {
        title: values.title,
        category: values.category,
        scope: values.scope,
        assignedTo: values.assignedTo,
        quantity: values.quantity,
        notes: values.notes,
      };

      if (mode === "create") {
        await createMutation.mutateAsync({ tripId, ...shared });
      } else {
        if (!hasValidItemId || !itemId) {
          setSubmitError("Packing item not found.");
          return;
        }
        await updateMutation.mutateAsync({ tripId, itemId, ...shared });
      }
      onSuccess();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save packing item.",
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
            placeholder="Passport, sunscreen, charger…"
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
              {TRIP_PACKING_CATEGORIES.map((category) => {
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
                      {getTripPackingCategoryLabel(category)}
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
        name="scope"
        render={({ field: { onChange, value }, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Shared or personal</Text>
            <View style={styles.chipRow}>
              {TRIP_PACKING_SCOPES.map((option) => {
                const selected = value === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    disabled={isSubmitting}
                    onPress={() => {
                      onChange(option);
                      if (option === "personal" && !form.getValues("assignedTo")) {
                        form.setValue("assignedTo", currentUserId ?? null, {
                          shouldDirty: true,
                        });
                      }
                      if (option === "shared") {
                        form.setValue("assignedTo", null, { shouldDirty: true });
                      }
                    }}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected ? styles.chipLabelSelected : null,
                      ]}
                    >
                      {getTripPackingScopeLabel(option)}
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

      {scope === "personal" ? (
        <Controller
          control={form.control}
          name="assignedTo"
          render={({ field: { onChange, value }, fieldState }) => (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Assigned to</Text>
              <View style={styles.chipRow}>
                {members.map((member) => {
                  const selected = value === member.profile.id;
                  return (
                    <Pressable
                      key={member.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={isSubmitting}
                      onPress={() => onChange(member.profile.id)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          selected ? styles.chipLabelSelected : null,
                        ]}
                      >
                        {member.profile.displayName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {fieldState.error ? (
                <Text style={styles.fieldError}>{fieldState.error.message}</Text>
              ) : (
                <Text style={styles.fieldHint}>
                  Personal items are only visible in this traveller&rsquo;s list.
                </Text>
              )}
            </View>
          )}
        />
      ) : null}

      <Controller
        control={form.control}
        name="quantity"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <AppTextInput
            label="Quantity"
            placeholder="1"
            value={value == null ? "" : String(value)}
            onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
            onBlur={onBlur}
            errorText={fieldState.error?.message}
            editable={!isSubmitting}
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
                ? "Add item"
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

export function PackingFormScreen({ mode }: PackingFormScreenProps) {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    itemId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const itemId = resolveRouteParam(localParams.itemId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidItemId = isValidUuid(itemId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    (mode === "create" || hasValidItemId);

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const packingQuery = useTripPackingQuery(
    tripId,
    shouldLoad && Boolean(tripQuery.data),
  );

  const createMutation = useCreatePackingItemMutation();
  const updateMutation = useUpdatePackingItemMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const members = trip?.members ?? [];
  const item =
    mode === "edit"
      ? (packingQuery.data ?? []).find((candidate) => candidate.id === itemId) ?? null
      : null;

  const canSubmit =
    mode === "create"
      ? canCreatePackingItem(role, "shared", null, user?.id) ||
        canCreatePackingItem(role, "personal", user?.id, user?.id)
      : item
        ? canEditPackingItem(
            role,
            { scope: item.scope, assignedTo: item.assignedTo, createdBy: item.createdBy },
            user?.id,
          )
        : false;

  const formDefaults: PackingItemFormInput | null =
    mode === "create" ? emptyDefaults(user?.id) : item ? toFormDefaults(item) : null;

  const formKey = mode === "create" ? "create-packing" : `edit-${item?.id ?? "pending"}`;

  const isLoading =
    shouldLoad && (tripQuery.isLoading || packingQuery.isLoading);

  const loadError = shouldLoad && (tripQuery.isError || packingQuery.isError);

  const showItemMissing =
    shouldLoad &&
    trip &&
    !loadError &&
    !isLoading &&
    mode === "edit" &&
    item == null;

  const showInvalidParams =
    !isPreviewActive && (!hasValidTripId || (mode === "edit" && !hasValidItemId));

  const title = mode === "create" ? "New packing item" : "Edit packing item";
  const subtitle = mode === "create" ? "Add to the packing list" : "Update item details";

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
            body="This packing link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to create or edit packing items."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading packing item…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (packingQuery.error instanceof Error && packingQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              void packingQuery.refetch();
            }}
          />
        ) : null}

        {showItemMissing ? (
          <EmptyState
            title="Packing item not found"
            body="This item may have been deleted or is not part of this trip."
          />
        ) : null}

        {shouldLoad &&
        trip &&
        !loadError &&
        !isLoading &&
        formDefaults &&
        canSubmit &&
        tripId ? (
          <PackingFormFields
            key={formKey}
            mode={mode}
            tripId={tripId}
            itemId={itemId}
            members={members}
            currentUserId={user?.id}
            defaultValues={formDefaults}
            hasValidItemId={hasValidItemId}
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
            body="You do not have permission to edit this packing item."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
