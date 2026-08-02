import { StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...shadows.md,
    borderColor: colors.surface,
  },
  muted: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
  },
});
