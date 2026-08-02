import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthBootstrap } from "@/components/ui/AuthBootstrap/AuthBootstrap";
import { useAuth } from "@/features/auth/AuthProvider";
import { canAccessAuthRoutes, canAccessProtectedApp } from "@/features/auth/authState";
import { usePreview } from "@/features/preview/PreviewProvider";
import { AppProviders } from "@/providers/AppProviders";
import { colors } from "@/theme";

function RootNavigator() {
  const { isInitializing, isAuthenticated } = useAuth();
  const { isPreviewActive } = usePreview();

  if (isInitializing) {
    return <AuthBootstrap />;
  }

  const canAccessApp = canAccessProtectedApp({
    isInitializing,
    isAuthenticated,
    isPreviewActive,
  });
  const canAccessAuth = canAccessAuthRoutes({
    isInitializing,
    isAuthenticated,
  });

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="invite/[token]" />

        <Stack.Protected guard={canAccessAuth}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={canAccessApp}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="trips" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
