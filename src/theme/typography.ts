import { TextStyle } from "react-native";
import { colors } from "./colors";

/**
 * Font families loaded via expo-font in ThemeProvider.
 * DM Sans — UI body and labels
 * Literata — brand and display headlines
 */
export const fontFamilies = {
  display: "Literata_600SemiBold",
  displayRegular: "Literata_400Regular",
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
  sansSemiBold: "DMSans_600SemiBold",
  sansBold: "DMSans_700Bold",
} as const;

const baseText: TextStyle = {
  color: colors.textPrimary,
};

export const typography = {
  brand: {
    ...baseText,
    fontFamily: fontFamilies.display,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  displayLarge: {
    ...baseText,
    fontFamily: fontFamilies.display,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.4,
  } satisfies TextStyle,

  displayMedium: {
    ...baseText,
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  headingLarge: {
    ...baseText,
    fontFamily: fontFamilies.sansBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
  } satisfies TextStyle,

  headingMedium: {
    ...baseText,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 20,
    lineHeight: 28,
  } satisfies TextStyle,

  headingSmall: {
    ...baseText,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
  } satisfies TextStyle,

  bodyLarge: {
    ...baseText,
    fontFamily: fontFamilies.sans,
    fontSize: 17,
    lineHeight: 26,
  } satisfies TextStyle,

  body: {
    ...baseText,
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,

  bodyMedium: {
    ...baseText,
    fontFamily: fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,

  bodySmall: {
    ...baseText,
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,

  label: {
    ...baseText,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  caption: {
    ...baseText,
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } satisfies TextStyle,

  button: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  } satisfies TextStyle,

  time: {
    ...baseText,
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
