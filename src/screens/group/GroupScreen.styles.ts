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
  memberName: {
    ...typography.headingSmall,
  },
  memberEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
});
