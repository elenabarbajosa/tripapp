import { StyleSheet } from "react-native";
import { colors, radii, sizes, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  field: {
    minHeight: sizes.inputHeight,
    borderWidth: sizes.hairline,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  fieldError: {
    borderColor: colors.error,
  },
  flag: {
    fontSize: 22,
  },
  fieldTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  fieldMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  placeholder: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  currencyHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    ...typography.headingSmall,
  },
  searchWrap: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  listContent: {
    paddingBottom: spacing.massive,
  },
  row: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.divider,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
  },
  rowTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    ...typography.body,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
