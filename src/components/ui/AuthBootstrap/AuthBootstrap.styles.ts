import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  brand: {
    ...typography.brand,
    color: colors.primary,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
