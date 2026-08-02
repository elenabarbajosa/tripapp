import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { DateField } from "@/components/ui/DateField/DateField";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useCreateTripDraft } from "@/features/trips/CreateTripDraftProvider";
import { pickerDateToISODate } from "@/utils/dateOnly";
import {
  createTripBasicsSchema,
  type CreateTripBasicsValues,
} from "@/validation/tripSchemas";
import { styles } from "./createTripWizard.styles";

export function CreateTripBasicsScreen() {
  const router = useRouter();
  const { draft, setBasics, resetDraft } = useCreateTripDraft();
  const today = pickerDateToISODate(new Date());

  const form = useForm<CreateTripBasicsValues>({
    resolver: zodResolver(createTripBasicsSchema),
    defaultValues: draft.basics ?? {
      name: "",
      startDate: today,
      endDate: today,
      coverImageUrl: "",
    },
  });

  const startDate = useWatch({ control: form.control, name: "startDate" });

  useEffect(() => {
    if (draft.basics) {
      form.reset(draft.basics);
    }
  }, [draft.basics, form]);

  useEffect(() => {
    const endDate = form.getValues("endDate");
    if (startDate && endDate && endDate < startDate) {
      form.setValue("endDate", startDate, { shouldValidate: true });
    }
  }, [form, startDate]);

  const onContinue = form.handleSubmit((values) => {
    setBasics(values);
    router.push("/trips/new/destinations");
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="New trip"
        subtitle="Step 1 of 4 · Basics"
        leftSlot={
          <IconButton
            icon="close"
            accessibilityLabel="Close create trip"
            variant="ghost"
            onPress={() => {
              resetDraft();
              router.back();
            }}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Trip basics</Text>
        <Text style={styles.body}>Name your trip and set the travel dates.</Text>
        <View style={styles.form}>
          <Controller
            control={form.control}
            name="name"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <AppTextInput
                label="Trip name"
                placeholder="Midwest Road Trip"
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
            name="startDate"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <DateField
                label="Start date"
                value={value}
                onChangeISO={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="endDate"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <DateField
                label="End date"
                value={value}
                minimumDate={startDate}
                onChangeISO={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="coverImageUrl"
            render={({ field: { onChange, onBlur, value }, fieldState }) => (
              <AppTextInput
                label="Cover image URL (optional)"
                placeholder="https://..."
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                errorText={fieldState.error?.message}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          <AppButton label="Continue" onPress={onContinue} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
