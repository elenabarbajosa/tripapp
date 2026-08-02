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
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: sizes.inputHeight,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});
