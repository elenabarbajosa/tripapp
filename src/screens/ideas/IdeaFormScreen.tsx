import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
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
import type { CreateTripIdeaInput, UpdateTripIdeaInput } from "@/features/ideas/api";
import {
  useCreateTripIdeaMutation,
  useTripIdeaQuery,
  useUpdateTripIdeaMutation,
} from "@/features/ideas/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canCreateIdea, canEditIdea } from "@/features/trips/permissions";
import type { TripDestination, TripIdea } from "@/types/models";
import { getTripIdeaCategoryLabel, TRIP_IDEA_CATEGORIES } from "@/utils/ideaCategory";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import {
  ideaFormSchema,
  type IdeaFormInput,
  type IdeaFormValues,
} from "@/validation/ideaSchemas";
import { styles } from "./IdeaFormScreen.styles";

export type IdeaFormMode = "create" | "edit";

export interface IdeaFormScreenProps {
  mode: IdeaFormMode;
}

const emptyDefaults: IdeaFormInput = {
  title: "",
  description: null,
  category: "activity",
  destinationId: null,
  locationName: null,
  address: null,
  geoapifyPlaceId: null,
  latitude: null,
  longitude: null,
};

function toFormDefaults(idea: TripIdea): IdeaFormInput {
  return {
    title: idea.title,
    description: idea.description,
    category: idea.category,
    destinationId: idea.destinationId,
    locationName: idea.locationName,
    address: idea.address,
    geoapifyPlaceId: idea.geoapifyPlaceId,
    latitude: idea.latitude,
    longitude: idea.longitude,
  };
}

interface IdeaFormFieldsProps {
  mode: IdeaFormMode;
  tripId: string;
  ideaId: string | undefined;
  destinations: TripDestination[];
  defaultValues: IdeaFormInput;
  hasValidIdeaId: boolean;
  createMutation: UseMutationResult<TripIdea, Error, CreateTripIdeaInput>;
  updateMutation: UseMutationResult<TripIdea, Error, UpdateTripIdeaInput>;
  isSubmitting: boolean;
  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;
  onSuccess: () => void;
  onCancel: () => void;
}

function IdeaFormFields({
  mode,
  tripId,
  ideaId,
  destinations,
  defaultValues,
  hasValidIdeaId,
  createMutation,
  updateMutation,
  isSubmitting,
  submitError,
  setSubmitError,
  onSuccess,
  onCancel,
}: IdeaFormFieldsProps) {
  const form = useForm<IdeaFormInput, unknown, IdeaFormValues>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

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
      const shared = {
        title: values.title,
        description: values.description,
        category: values.category,
        destinationId: values.destinationId,
        locationName: values.locationName,
        address: values.address,
        geoapifyPlaceId: values.geoapifyPlaceId,
        latitude: values.latitude,
        longitude: values.longitude,
      };

      if (mode === "create") {
        await createMutation.mutateAsync({ tripId, ...shared });
      } else {
        if (!hasValidIdeaId || !ideaId) {
          setSubmitError("Idea not found.");
          return;
        }
        await updateMutation.mutateAsync({ tripId, ideaId, ...shared });
      }
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save idea.");
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
            placeholder="Visit the night market"
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
              {TRIP_IDEA_CATEGORIES.map((category) => {
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
                      {getTripIdeaCategoryLabel(category)}
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
            placeholder="Why should the group check this out?"
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
                ? "Add idea"
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

export function IdeaFormScreen({ mode }: IdeaFormScreenProps) {
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

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    (mode === "create" || hasValidIdeaId);

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const ideaQuery = useTripIdeaQuery(
    tripId,
    ideaId,
    user?.id,
    shouldLoad && mode === "edit" && Boolean(tripQuery.data),
  );

  const createMutation = useCreateTripIdeaMutation();
  const updateMutation = useUpdateTripIdeaMutation(user?.id);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const destinations = trip?.destinations ?? [];
  const idea = ideaQuery.data ?? null;

  const canSubmit =
    mode === "create"
      ? canCreateIdea(role)
      : idea
        ? canEditIdea(role, idea, user?.id)
        : false;

  const formDefaults: IdeaFormInput | null =
    mode === "create" ? emptyDefaults : idea ? toFormDefaults(idea) : null;

  const formKey = mode === "create" ? "create-idea" : `edit-${idea?.id ?? "pending"}`;

  const isLoading = shouldLoad && (tripQuery.isLoading || (mode === "edit" && ideaQuery.isLoading));

  const loadError =
    shouldLoad && (tripQuery.isError || (mode === "edit" && ideaQuery.isError));

  const showIdeaMissing =
    shouldLoad && trip && !loadError && !isLoading && mode === "edit" && idea == null;

  const showInvalidParams =
    !isPreviewActive && (!hasValidTripId || (mode === "edit" && !hasValidIdeaId));

  const title = mode === "create" ? "New idea" : "Edit idea";
  const subtitle = mode === "create" ? "Propose a place or activity" : "Update idea details";

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
            body="This idea link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to create or edit ideas."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading idea…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load form"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (ideaQuery.error instanceof Error && ideaQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              if (mode === "edit") {
                void ideaQuery.refetch();
              }
            }}
          />
        ) : null}

        {showIdeaMissing ? (
          <EmptyState
            title="Idea not found"
            body="This idea may have been deleted or is not part of this trip."
          />
        ) : null}

        {shouldLoad &&
        trip &&
        !loadError &&
        !isLoading &&
        formDefaults &&
        canSubmit &&
        tripId ? (
          <IdeaFormFields
            key={formKey}
            mode={mode}
            tripId={tripId}
            ideaId={ideaId}
            destinations={destinations}
            defaultValues={formDefaults}
            hasValidIdeaId={hasValidIdeaId}
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
            body="You do not have permission to edit this idea."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
