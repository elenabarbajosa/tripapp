import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { branding } from "@/constants/branding";
import { styles } from "./WelcomeScreen.styles";

function showAuthNotConfigured(provider: "Apple" | "Google") {
  Alert.alert(
    `${provider} sign-in not configured`,
    `${provider} credentials are not set up yet. This will be wired in Phase 2. Use email sign-in or continue to the demo home screen.`,
  );
}

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.brandMark} accessibilityLabel={`${branding.productName} logo`}>
            <Text style={styles.brandMarkText}>T</Text>
          </View>
          <Text style={styles.brand}>{branding.productName}</Text>
          <Text style={styles.headline}>{branding.shortTagline}</Text>
          <Text style={styles.supporting}>{branding.tagline}</Text>
        </View>

        <View style={styles.actions}>
          <AppButton
            label="Continue with Apple"
            onPress={() => showAuthNotConfigured("Apple")}
            accessibilityLabel="Continue with Apple"
          />
          <AppButton
            label="Continue with Google"
            variant="secondary"
            onPress={() => showAuthNotConfigured("Google")}
            accessibilityLabel="Continue with Google"
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppButton
            label="Continue with email"
            variant="ghost"
            onPress={() => router.push("/(auth)/email-auth")}
          />

          <AppButton
            label="Preview app (Phase 1)"
            variant="secondary"
            onPress={() => router.replace("/(main)/home")}
          />

          <Text style={styles.footerNote}>
            Authentication providers connect in Phase 2. Preview uses local mock data.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
