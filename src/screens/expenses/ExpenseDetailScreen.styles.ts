import { StyleSheet } from "react-native";
import { colors, radii, spacing, sizes, typography } from "@/theme";

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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  categoryLabel: {
    ...typography.label,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  amount: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  splitName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  splitAmount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  notes: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
