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
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
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
  sectionTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    ...typography.caption,
    color: colors.onPrimary,
  },
  itemBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  itemTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  itemTitlePacked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
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
