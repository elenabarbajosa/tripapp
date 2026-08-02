import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Literata_400Regular,
  Literata_600SemiBold,
} from "@expo-google-fonts/literata";
import * as SplashScreen from "expo-splash-screen";

import { colors } from "./colors";
import { radii } from "./radii";
import { shadows } from "./shadows";
import { sizes } from "./sizes";
import { spacing } from "./spacing";
import { typography, fontFamilies } from "./typography";
import { styles } from "./ThemeProvider.styles";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const theme = {
  colors,
  spacing,
  radii,
  shadows,
  sizes,
  typography,
  fontFamilies,
} as const;

export type AppTheme = typeof theme;

const ThemeContext = createContext<AppTheme>(theme);

type ThemeProviderProps = PropsWithChildren;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Literata_400Regular,
    Literata_600SemiBold,
  });

  const value = useMemo(() => theme, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingRoot} accessibilityLabel="Loading fonts">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (fontsLoaded || fontError) {
    void SplashScreen.hideAsync().catch(() => undefined);
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
