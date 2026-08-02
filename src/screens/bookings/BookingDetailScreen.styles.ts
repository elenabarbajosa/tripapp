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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
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
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  copyButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyButtonLabel: {
    ...typography.caption,
    color: colors.primary,
  },
  notes: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
