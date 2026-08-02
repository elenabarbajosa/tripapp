import { colors, radii, spacing, typography } from "@/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
  },
  selectedCard: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  selectedTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectedAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  selectedBadge: {
    ...typography.caption,
    color: colors.primary,
  },
  suggestions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionRowLast: {
    borderBottomWidth: 0,
  },
  suggestionPrimary: {
    ...typography.body,
    color: colors.textPrimary,
  },
  suggestionSecondary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  attribution: {
    ...typography.caption,
    color: colors.textMuted,
    paddingTop: spacing.xs,
  },
  addressField: {
    marginTop: spacing.xs,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  clearLabel: {
    ...typography.bodySmall,
    color: colors.primary,
  },
});
