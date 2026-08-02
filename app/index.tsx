import { Redirect } from "expo-router";

import { AuthBootstrap } from "@/components/ui/AuthBootstrap/AuthBootstrap";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";

/**
 * Anchor route for Expo Router protected navigation.
 * Resolves after session restoration to avoid auth flashes.
 */
export default function Index() {
  const { isInitializing, isAuthenticated } = useAuth();
  const { isPreviewActive } = usePreview();

  if (isInitializing) {
    return <AuthBootstrap />;
  }

  if (isAuthenticated || isPreviewActive) {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
