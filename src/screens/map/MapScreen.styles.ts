import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  controls: {
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  modeChipLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  modeChipLabelSelected: {
    color: colors.primary,
  },
  mapArea: {
    flex: 1,
    minHeight: 280,
    gap: spacing.sm,
  },
  cardWrap: {
    zIndex: 3,
  },
  fallbackList: {
    flex: 1,
    minHeight: 160,
  },
  actionError: {
    ...typography.bodySmall,
    color: colors.error,
  },
  unmappedHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
