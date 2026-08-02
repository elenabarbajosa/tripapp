import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { branding } from "@/constants/branding";
import { usePreview } from "@/features/preview/PreviewProvider";
import { shouldShowDevPreviewButton } from "@/features/auth/authState";
import { appConfig } from "@/constants/config";
import { styles } from "./WelcomeScreen.styles";

function showComingSoon(provider: "Apple" | "Google") {
  Alert.alert(
    `${provider} sign-in`,
    `${provider} sign-in will be configured in the next authentication step.`,
  );
}

export function WelcomeScreen() {
  const router = useRouter();
  const { enterPreview } = usePreview();
  const showPreview = shouldShowDevPreviewButton(appConfig.isDevelopment);

  const handlePreview = () => {
    const started = enterPreview();
    if (!started) {
      return;
    }
    router.replace("/(main)/home");
  };

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
            onPress={() => showComingSoon("Apple")}
            accessibilityLabel="Continue with Apple"
          />
          <AppButton
            label="Continue with Google"
            variant="secondary"
            onPress={() => showComingSoon("Google")}
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

          {showPreview ? (
            <AppButton
              label="Preview app"
              variant="secondary"
              onPress={handlePreview}
            />
          ) : null}

          <Text style={styles.footerNote}>
            {showPreview
              ? "Preview uses local mock data and is available in development only."
              : "Sign in with email to continue. Google and Apple arrive next."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
