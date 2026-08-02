import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.massive,
    gap: spacing.lg,
  },
  title: {
    ...typography.displayMedium,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
  },
  destinationCard: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destinationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  destinationTitle: {
    ...typography.headingSmall,
  },
  reorderRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  optionCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionTitle: {
    ...typography.headingSmall,
  },
  optionBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryBlock: {
    gap: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    ...typography.body,
  },
  footerNote: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
