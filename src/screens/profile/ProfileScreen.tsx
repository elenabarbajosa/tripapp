import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { MemberAvatar } from "@/components/MemberAvatar/MemberAvatar";
import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { mockCurrentUser } from "@/data/mock";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import { getSupabaseStatusMessage } from "@/services/supabase";
import { styles } from "./ProfileScreen.styles";

export function ProfileScreen() {
  const router = useRouter();
  const { profile, isAuthenticated, isProfileLoading, signOut } = useAuth();
  const { isPreviewActive, exitPreview } = usePreview();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayProfile = isAuthenticated && profile ? profile : isPreviewActive ? mockCurrentUser : null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setErrorMessage(null);
    try {
      if (isAuthenticated) {
        await signOut();
      }
      exitPreview();
      setConfirmSignOut(false);
      router.replace("/(auth)/welcome");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isAuthenticated && isProfileLoading && !profile) {
    return <LoadingState label="Loading profile…" />;
  }

  if (!displayProfile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.body}>Sign in to view your profile.</Text>
          <AppButton label="Go to welcome" onPress={() => router.replace("/(auth)/welcome")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <MemberAvatar
          name={displayProfile.displayName}
          imageUrl={displayProfile.avatarUrl}
          size="xl"
        />
        <Text style={styles.title}>{displayProfile.displayName}</Text>
        <Text style={styles.body}>{displayProfile.email}</Text>
        <Text style={styles.body}>Preferred currency: {displayProfile.preferredCurrency}</Text>
        {isPreviewActive && !isAuthenticated ? (
          <Text style={styles.body}>Development preview — mock profile data.</Text>
        ) : (
          <Text style={styles.body}>{getSupabaseStatusMessage()}</Text>
        )}
        {errorMessage ? <Text style={styles.body}>{errorMessage}</Text> : null}
        <AppButton
          label={isAuthenticated ? "Sign out" : "Exit preview"}
          variant="secondary"
          loading={isSigningOut}
          onPress={() => {
            if (isAuthenticated) {
              setConfirmSignOut(true);
              return;
            }
            exitPreview();
            router.replace("/(auth)/welcome");
          }}
        />
      </View>

      <ConfirmationDialog
        visible={confirmSignOut}
        title="Sign out?"
        message="You will need to sign in again to access your trips."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}
