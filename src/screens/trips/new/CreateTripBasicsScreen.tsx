import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { DateField } from "@/components/ui/DateField/DateField";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { styles } from "./CreateTripBasicsScreen.styles";

export function CreateTripBasicsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="New trip"
        subtitle="Step 1 of 5 · Basics"
        leftSlot={
          <IconButton
            icon="close"
            accessibilityLabel="Close create trip"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <View style={styles.content}>
        <Text style={styles.title}>Trip basics</Text>
        <Text style={styles.body}>
          Name your trip and set the dates. Destinations, travellers, and currency come next in
          Phase 3.
        </Text>
        <View style={styles.form}>
          <AppTextInput label="Trip name" placeholder="Midwest Road Trip" />
          <DateField label="Start date" value="2026-09-12" />
          <DateField label="End date" value="2026-09-24" />
          <AppButton label="Continue" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
