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
    gap: spacing.lg,
  },
  heroCard: {
    gap: spacing.md,
  },
  countdown: {
    ...typography.label,
    color: colors.primary,
  },
  tripName: {
    ...typography.displayMedium,
  },
  destinations: {
    ...typography.body,
    color: colors.textSecondary,
  },
  question: {
    ...typography.headingLarge,
  },
  nextActivityMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.headingSmall,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.headingMedium,
  },
  voteQuestion: {
    ...typography.headingSmall,
  },
  voteMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
