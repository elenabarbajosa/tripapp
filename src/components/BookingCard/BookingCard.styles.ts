import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  title: {
    ...typography.headingSmall,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  code: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
