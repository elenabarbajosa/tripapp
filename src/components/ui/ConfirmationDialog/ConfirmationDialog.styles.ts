import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.headingMedium,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
