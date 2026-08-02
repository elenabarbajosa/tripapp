import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import {
  useCreateTripDraft,
  type TravellerMode,
} from "@/features/trips/CreateTripDraftProvider";
import { styles } from "./createTripWizard.styles";

const OPTIONS: { mode: TravellerMode; title: string; body: string }[] = [
  {
    mode: "solo",
    title: "Just me",
    body: "Create a solo trip. You will be the owner.",
  },
  {
    mode: "invite_later",
    title: "Add people later",
    body: "Skip invitations for now. Invite travellers from the group screen in Phase 3B.",
  },
];

export function CreateTripTravellersScreen() {
  const router = useRouter();
  const { draft, setTravellerMode } = useCreateTripDraft();

  useEffect(() => {
    if (!draft.basics || draft.destinations.length === 0) {
      router.replace("/trips/new/basics");
    }
  }, [draft.basics, draft.destinations.length, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Travellers"
        subtitle="Step 3 of 4 · People"
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
        <Text style={styles.title}>Who is coming?</Text>
        <Text style={styles.body}>
          Email invitations and share links arrive in Phase 3B. For now, create the trip as solo or
          add people later.
        </Text>
        <View style={styles.form}>
          {OPTIONS.map((option) => {
            const selected = draft.travellerMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setTravellerMode(option.mode)}
                style={[styles.optionCard, selected ? styles.optionCardSelected : null]}
              >
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionBody}>{option.body}</Text>
              </Pressable>
            );
          })}
          <AppButton label="Continue" onPress={() => router.push("/trips/new/confirm")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
