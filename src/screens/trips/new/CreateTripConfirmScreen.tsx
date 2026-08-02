import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { getCountryByCode, resolvePrimaryTripCurrency } from "@/data/countries";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCreateTripDraft } from "@/features/trips/CreateTripDraftProvider";
import { useCreateTripMutation } from "@/features/trips/hooks";
import { eachISODateInRange } from "@/utils/date";
import { formatLocalDisplayDate } from "@/utils/dateOnly";
import { styles } from "./createTripWizard.styles";

export function CreateTripConfirmScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { draft, resetDraft } = useCreateTripDraft();
  const createTripMutation = useCreateTripMutation();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.basics || draft.destinations.length === 0) {
      router.replace("/trips/new/basics");
    }
  }, [draft.basics, draft.destinations.length, router]);

  const primaryCurrency = useMemo(
    () => resolvePrimaryTripCurrency(draft.destinations),
    [draft.destinations],
  );

  const currenciesDiffer = useMemo(() => {
    const codes = new Set(
      draft.destinations
        .map((destination) => destination.currencyCode)
        .filter((code): code is string => Boolean(code)),
    );
    return codes.size > 1;
  }, [draft.destinations]);

  if (!draft.basics) {
    return null;
  }

  const dayCount = eachISODateInRange(draft.basics.startDate, draft.basics.endDate).length;

  const onCreate = async () => {
    if (!primaryCurrency) {
      setFormError("Add a destination with a valid currency before creating the trip.");
      return;
    }

    setFormError(null);
    try {
      await createTripMutation.mutateAsync({
        name: draft.basics!.name,
        startDate: draft.basics!.startDate,
        endDate: draft.basics!.endDate,
        coverImageUrl: draft.basics!.coverImageUrl || null,
        homeCurrency: profile?.preferredCurrency || primaryCurrency,
        destinations: draft.destinations.map((destination, index) => ({
          city: destination.city,
          country: destination.country,
          countryCode: destination.countryCode,
          currencyCode: destination.currencyCode!,
          arrivalDate: destination.arrivalDate,
          departureDate: destination.departureDate,
          displayOrder: index + 1,
        })),
      });
      resetDraft();
      // Leave the create-trip stack and land on authenticated Home with fresh trip list.
      router.replace("/(main)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create trip.";
      setFormError(message);
      Alert.alert("Could not create trip", message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Review"
        subtitle="Step 4 of 4 · Confirm"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ready to create?</Text>
        <Text style={styles.body}>
          We will create the trip, add you as owner, and generate {dayCount} day
          {dayCount === 1 ? "" : "s"} between the start and end dates.
        </Text>
        <View style={styles.form}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Trip</Text>
            <Text style={styles.summaryValue}>{draft.basics.name}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Dates</Text>
            <Text style={styles.summaryValue}>
              {formatLocalDisplayDate(draft.basics.startDate)} –{" "}
              {formatLocalDisplayDate(draft.basics.endDate)}
            </Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Destinations</Text>
            {draft.destinations.map((destination) => {
              const country = getCountryByCode(destination.countryCode);
              return (
                <Text key={destination.id} style={styles.summaryValue}>
                  {country?.flag ? `${country.flag} ` : ""}
                  {destination.city}, {destination.country}
                  {"\n"}
                  {formatLocalDisplayDate(destination.arrivalDate)} –{" "}
                  {formatLocalDisplayDate(destination.departureDate)}
                  {currenciesDiffer && destination.currencyCode
                    ? `\nCurrency: ${destination.currencyCode}`
                    : ""}
                </Text>
              );
            })}
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Travellers</Text>
            <Text style={styles.summaryValue}>
              {draft.travellerMode === "solo" ? "Solo trip (you)" : "You now — invite later"}
            </Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Primary trip currency</Text>
            <Text style={styles.summaryValue}>{primaryCurrency ?? "—"}</Text>
            <Text style={styles.footerNote}>
              Used for budgets and converted totals. You can change it later in Trip Settings.
            </Text>
          </View>
          {formError ? <Text style={styles.error}>{formError}</Text> : null}
          <AppButton
            label={createTripMutation.isPending ? "Creating…" : "Create trip"}
            onPress={onCreate}
            disabled={createTripMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
