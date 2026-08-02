import { StyleSheet } from "react-native";
import { colors, radii, sizes, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  sm: {
    minHeight: sizes.buttonHeightSm,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: colors.primarySoft,
  },
  destructive: {
    backgroundColor: colors.errorSoft,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.button,
  },
  labelPrimary: {
    color: colors.onPrimary,
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelGhost: {
    color: colors.primary,
  },
  labelDestructive: {
    color: colors.error,
  },
});
