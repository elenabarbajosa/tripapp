import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  memberMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  memberName: {
    ...typography.headingSmall,
  },
  youLabel: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  memberEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  inviteBlock: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  inviteTitle: {
    ...typography.headingMedium,
  },
  inviteBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  pendingList: {
    gap: spacing.md,
  },
  pendingTitle: {
    ...typography.headingSmall,
  },
  pendingCard: {
    gap: spacing.sm,
  },
  pendingLabel: {
    ...typography.body,
  },
  leaveBlock: {
    marginTop: spacing.xl,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
