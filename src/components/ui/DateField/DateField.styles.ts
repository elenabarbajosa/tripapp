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
    gap: spacing.sm,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.error,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  calendarButton: {
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    ...typography.caption,
    color: colors.textMuted,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  iosSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iosSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    minHeight: sizes.touchTarget,
  },
  iosSheetTitle: {
    ...typography.headingSmall,
  },
  iosSheetAction: {
    ...typography.body,
    color: colors.textSecondary,
    minWidth: sizes.touchTarget,
  },
  iosSheetActionPrimary: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
    textAlign: "right",
    minWidth: sizes.touchTarget,
  },
  iosSheetSelected: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  iosPickerWrap: {
    alignItems: "center",
    width: "100%",
  },
});
