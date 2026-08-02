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
    gap: spacing.xl,
  },
  dayBlock: {
    gap: spacing.md,
  },
  dayHeader: {
    gap: spacing.xxs,
  },
  dayTitle: {
    ...typography.headingMedium,
  },
  dayMeta: {
    ...typography.caption,
  },
  emptyDay: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.md,
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
