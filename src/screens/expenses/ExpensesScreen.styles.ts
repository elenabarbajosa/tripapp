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
  balancesCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  balancesTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  balanceAmountPositive: {
    ...typography.bodySmall,
    color: colors.success,
  },
  balanceAmountNegative: {
    ...typography.bodySmall,
    color: colors.error,
  },
  balanceAmountSettled: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionsRowItem: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  cardAmount: {
    ...typography.body,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
    gap: spacing.sm,
  },
});
