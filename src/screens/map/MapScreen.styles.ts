import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xxl,
    justifyContent: "center",
    gap: spacing.md,
  },
  title: {
    ...typography.headingLarge,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
