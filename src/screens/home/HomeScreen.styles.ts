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
    gap: spacing.xxl,
  },
  headerBlock: {
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    ...typography.displayMedium,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.headingMedium,
  },
  invitationCard: {
    gap: spacing.md,
  },
  invitationBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  invitationTitle: {
    ...typography.headingSmall,
  },
  invitationMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  invitationActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  invitationAction: {
    flex: 1,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
