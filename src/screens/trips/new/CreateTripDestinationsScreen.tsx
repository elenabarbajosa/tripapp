import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { CountryPickerField } from "@/components/ui/CountryPickerField/CountryPickerField";
import { DateField } from "@/components/ui/DateField/DateField";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useCreateTripDraft } from "@/features/trips/CreateTripDraftProvider";
import {
  buildNextDestinationDefaults,
  createTripDestinationsSchema,
  type CreateTripDestinationItemValues,
  type CreateTripDestinationsValues,
} from "@/validation/tripSchemas";
import { styles } from "./createTripWizard.styles";

function createDestination(input: {
  tripStartDate: string;
  tripEndDate: string;
  previous?: Pick<CreateTripDestinationItemValues, "departureDate"> | null;
}) {
  const dates = buildNextDestinationDefaults(input);
  return {
    id: `dest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    city: "",
    country: "",
    countryCode: "",
    currencyCode: null as string | null,
    arrivalDate: dates.arrivalDate,
    departureDate: dates.departureDate,
  };
}

export function CreateTripDestinationsScreen() {
  const router = useRouter();
  const { draft, setDestinations } = useCreateTripDraft();

  const startDate = draft.basics?.startDate ?? "";
  const endDate = draft.basics?.endDate ?? "";

  const form = useForm<CreateTripDestinationsValues>({
    resolver: zodResolver(createTripDestinationsSchema),
    defaultValues: {
      tripStartDate: startDate,
      tripEndDate: endDate,
      destinations:
        draft.destinations.length > 0
          ? draft.destinations
          : [
              createDestination({
                tripStartDate: startDate,
                tripEndDate: endDate,
              }),
            ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "destinations",
  });

  const destinations = useWatch({ control: form.control, name: "destinations" });

  useEffect(() => {
    if (!draft.basics) {
      router.replace("/trips/new/basics");
    }
  }, [draft.basics, router]);

  useEffect(() => {
    form.setValue("tripStartDate", startDate);
    form.setValue("tripEndDate", endDate);
  }, [endDate, form, startDate]);

  const onContinue = form.handleSubmit((values) => {
    setDestinations(values.destinations);
    router.push("/trips/new/travellers");
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Destinations"
        subtitle="Step 2 of 4 · Places"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Where are you going?</Text>
        <Text style={styles.body}>
          Add one city or several stops. Currency is set automatically from each country.
        </Text>
        <View style={styles.form}>
          {fields.map((field, index) => {
            const arrivalDate = destinations?.[index]?.arrivalDate ?? startDate;
            return (
              <View key={field.id} style={styles.destinationCard}>
                <View style={styles.destinationHeader}>
                  <Text style={styles.destinationTitle}>Stop {index + 1}</Text>
                  <View style={styles.reorderRow}>
                    <IconButton
                      icon="arrow-up"
                      accessibilityLabel={`Move stop ${index + 1} up`}
                      variant="ghost"
                      onPress={() => index > 0 && move(index, index - 1)}
                    />
                    <IconButton
                      icon="arrow-down"
                      accessibilityLabel={`Move stop ${index + 1} down`}
                      variant="ghost"
                      onPress={() => index < fields.length - 1 && move(index, index + 1)}
                    />
                    {fields.length > 1 ? (
                      <IconButton
                        icon="trash-outline"
                        accessibilityLabel={`Remove stop ${index + 1}`}
                        variant="ghost"
                        onPress={() => remove(index)}
                      />
                    ) : null}
                  </View>
                </View>
                <Controller
                  control={form.control}
                  name={`destinations.${index}.city`}
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <AppTextInput
                      label="City or destination"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`destinations.${index}.countryCode`}
                  render={({ field: { onChange, value }, fieldState }) => (
                    <CountryPickerField
                      label="Country"
                      countryCode={value || null}
                      errorText={
                        fieldState.error?.message ??
                        form.formState.errors.destinations?.[index]?.currencyCode?.message
                      }
                      onSelect={(country) => {
                        onChange(country.countryCode);
                        form.setValue(`destinations.${index}.country`, country.name, {
                          shouldValidate: true,
                        });
                        form.setValue(`destinations.${index}.currencyCode`, country.currencyCode, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  )}
                />
                {!destinations?.[index]?.currencyCode && destinations?.[index]?.countryCode ? (
                  <Controller
                    control={form.control}
                    name={`destinations.${index}.currencyCode`}
                    render={({ field: { onChange, value }, fieldState }) => (
                      <AppTextInput
                        label="Currency (required for this country)"
                        placeholder="USD"
                        value={value ?? ""}
                        onChangeText={(text) => onChange(text.toUpperCase())}
                        errorText={fieldState.error?.message}
                        autoCapitalize="characters"
                        maxLength={3}
                      />
                    )}
                  />
                ) : null}
                <Controller
                  control={form.control}
                  name={`destinations.${index}.arrivalDate`}
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <DateField
                      label="Arrival date"
                      value={value}
                      minimumDate={startDate}
                      maximumDate={endDate}
                      onChangeISO={(iso) => {
                        onChange(iso);
                        const departure = form.getValues(`destinations.${index}.departureDate`);
                        if (departure && departure < iso) {
                          form.setValue(`destinations.${index}.departureDate`, iso, {
                            shouldValidate: true,
                          });
                        }
                        void form.trigger([
                          `destinations.${index}.arrivalDate`,
                          `destinations.${index}.departureDate`,
                        ]);
                      }}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name={`destinations.${index}.departureDate`}
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <DateField
                      label="Departure date"
                      value={value}
                      minimumDate={arrivalDate}
                      maximumDate={endDate}
                      onChangeISO={(iso) => {
                        onChange(iso);
                        void form.trigger(`destinations.${index}.departureDate`);
                      }}
                      onBlur={onBlur}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
              </View>
            );
          })}

          {typeof form.formState.errors.destinations?.message === "string" ||
          form.formState.errors.destinations?.root?.message ? (
            <Text style={styles.error}>
              {form.formState.errors.destinations?.root?.message ??
                form.formState.errors.destinations?.message}
            </Text>
          ) : null}

          <AppButton
            label="Add destination"
            variant="secondary"
            onPress={() => {
              const current = form.getValues("destinations");
              const previous = current[current.length - 1];
              append(
                createDestination({
                  tripStartDate: startDate,
                  tripEndDate: endDate,
                  previous,
                }),
              );
            }}
          />
          <AppButton label="Continue" onPress={onContinue} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
