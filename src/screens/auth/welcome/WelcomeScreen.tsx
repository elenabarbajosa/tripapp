import { useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { AppleSignInButton } from "@/components/auth/AppleSignInButton/AppleSignInButton";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { branding } from "@/constants/branding";
import { appConfig, getGoogleConfigMessage } from "@/constants/config";
import { useAuth } from "@/features/auth/AuthProvider";
import { shouldShowDevPreviewButton } from "@/features/auth/authState";
import { usePreview } from "@/features/preview/PreviewProvider";
import { colors } from "@/theme";
import { styles } from "./WelcomeScreen.styles";

export function WelcomeScreen() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithApple,
    isGoogleSignInAvailable,
    isAppleSignInAvailable,
    socialAuthLoadingProvider,
    isConfigured,
    configurationMessage,
  } = useAuth();
  const { enterPreview } = usePreview();
  const [localError, setLocalError] = useState<string | null>(null);

  const showPreview = shouldShowDevPreviewButton(appConfig.isDevelopment);
  const isBusy = socialAuthLoadingProvider !== null;
  const googleLoading = socialAuthLoadingProvider === "google";
  const appleLoading = socialAuthLoadingProvider === "apple";

  const handlePreview = () => {
    const started = enterPreview();
    if (!started) {
      return;
    }
    router.replace("/(main)/home");
  };

  const handleGoogle = async () => {
    setLocalError(null);

    if (!isConfigured) {
      Alert.alert("Supabase not configured", configurationMessage);
      return;
    }

    if (!isGoogleSignInAvailable) {
      Alert.alert("Google sign-in", getGoogleConfigMessage());
      return;
    }

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        return;
      }
      router.replace("/(main)/home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      setLocalError(message);
      Alert.alert("Google sign-in", message);
    }
  };

  const handleApple = async () => {
    setLocalError(null);

    if (!isConfigured) {
      Alert.alert("Supabase not configured", configurationMessage);
      return;
    }

    if (!isAppleSignInAvailable) {
      Alert.alert(
        "Apple sign-in",
        "Apple sign-in will be configured in the next authentication step once Sign in with Apple is enabled for this app.",
      );
      return;
    }

    try {
      const result = await signInWithApple();
      if (result.cancelled) {
        return;
      }
      router.replace("/(main)/home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Apple sign-in failed. Please try again.";
      setLocalError(message);
      Alert.alert("Apple sign-in", message);
    }
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
          {isAppleSignInAvailable ? (
            <View>
              <AppleSignInButton onPress={handleApple} disabled={isBusy} />
              {appleLoading ? (
                <View style={styles.providerLoading}>
                  <ActivityIndicator color={colors.primary} accessibilityLabel="Signing in with Apple" />
                </View>
              ) : null}
            </View>
          ) : (
            <AppButton
              label="Continue with Apple"
              onPress={handleApple}
              disabled={isBusy}
              accessibilityLabel="Continue with Apple"
            />
          )}

          <AppButton
            label={googleLoading ? "Connecting to Google…" : "Continue with Google"}
            variant="secondary"
            onPress={handleGoogle}
            loading={googleLoading}
            disabled={isBusy}
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
            disabled={isBusy}
          />

          {showPreview ? (
            <AppButton
              label="Preview app"
              variant="secondary"
              onPress={handlePreview}
              disabled={isBusy}
            />
          ) : null}

          {localError ? <Text style={styles.errorNote}>{localError}</Text> : null}

          <Text style={styles.footerNote}>
            {showPreview
              ? "Preview uses local mock data and is available in development only."
              : "Sign in with Apple, Google, or email to continue."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
