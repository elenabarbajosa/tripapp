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
  daySelector: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dayChip: {
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xxs,
    alignItems: "center",
  },
  dayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  dayChipNumber: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dayChipNumberSelected: {
    color: colors.primary,
  },
  dayChipWeekday: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  dayChipWeekdaySelected: {
    color: colors.primary,
  },
  dayChipDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dayChipDateSelected: {
    color: colors.primary,
  },
  dayMeta: {
    gap: spacing.xxs,
  },
  dayTitle: {
    ...typography.headingMedium,
  },
  daySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
  fabSpacer: {
    height: spacing.massive,
  },
  fabContainer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
