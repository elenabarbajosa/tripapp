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
  pressed: {
    backgroundColor: colors.surfaceSecondary,
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
  dateLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  typeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  typeLabel: {
    ...typography.label,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  code: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
