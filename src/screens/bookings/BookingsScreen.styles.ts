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
  filterRow: {
    paddingVertical: spacing.sm,
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
  list: {
    gap: spacing.md,
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
