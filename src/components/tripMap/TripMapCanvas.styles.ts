import { StyleSheet } from "react-native";
import { colors, mapColors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  map: {
    flex: 1,
  },
  fitButtonWrap: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  fitButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fitButtonLabel: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  attributionWrap: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    zIndex: 2,
  },
  selectedHint: {
    borderColor: mapColors.selectionRing,
  },
});
