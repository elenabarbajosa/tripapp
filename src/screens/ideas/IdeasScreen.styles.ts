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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterChipLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterChipLabelSelected: {
    color: colors.primary,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  voteColumn: {
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.xxs,
    minWidth: 48,
  },
  voteButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  voteButtonActive: {
    backgroundColor: colors.primary,
  },
  voteButtonMark: {
    ...typography.headingSmall,
    color: colors.primary,
  },
  voteButtonMarkActive: {
    color: colors.onPrimary,
  },
  voteCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.successSoft,
  },
  statusBadgeLabel: {
    ...typography.caption,
    color: colors.success,
  },
  archivedBadge: {
    backgroundColor: colors.surfaceSecondary,
  },
  archivedBadgeLabel: {
    color: colors.textMuted,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xxs,
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
