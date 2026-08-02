import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  item: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  type: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
