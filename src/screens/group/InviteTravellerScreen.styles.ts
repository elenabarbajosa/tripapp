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
  successBlock: {
    gap: spacing.lg,
  },
  title: {
    ...typography.headingMedium,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.lg,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
  },
  segmentLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  segmentLabelSelected: {
    color: colors.textPrimary,
    fontFamily: typography.headingSmall.fontFamily,
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
  linkLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  linkValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
