import { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { PreviewProvider } from "@/features/preview/PreviewProvider";
import { AppQueryProvider } from "@/providers/AppQueryProvider";
import { ThemeProvider } from "@/theme";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppQueryProvider>
          <AuthProvider>
            <PreviewProvider>{children}</PreviewProvider>
          </AuthProvider>
        </AppQueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
