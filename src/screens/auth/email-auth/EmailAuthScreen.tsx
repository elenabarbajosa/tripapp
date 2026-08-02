import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { styles } from "./EmailAuthScreen.styles";

export function EmailAuthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Email sign-in"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Go back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <View style={styles.container}>
        <Text style={styles.title}>Continue with email</Text>
        <Text style={styles.body}>
          Email authentication will connect to Supabase Auth in Phase 2. This screen is a polished
          shell for the flow.
        </Text>
        <View style={styles.form}>
          <AppTextInput
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <AppTextInput
            label="Password"
            placeholder="Your password"
            secureTextEntry
          />
          <AppButton label="Sign in" onPress={() => router.replace("/(main)/home")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
