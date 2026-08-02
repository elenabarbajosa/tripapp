import { StyleSheet } from "react-native";
import { colors, radii, sizes, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  currency: {
    minWidth: 72,
    minHeight: sizes.inputHeight,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  currencyLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  amount: {
    flex: 1,
    minHeight: sizes.inputHeight,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
  },
});
