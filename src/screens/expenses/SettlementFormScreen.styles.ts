import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  fieldBlock: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  fieldError: {
    ...typography.bodySmall,
    color: colors.error,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  submitError: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
