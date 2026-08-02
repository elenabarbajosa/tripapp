import { StyleSheet } from "react-native";
import { colors, radii, spacing, sizes, typography } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headerMain: {
    flex: 1,
    gap: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
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
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
