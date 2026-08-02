import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...typography.headingSmall,
    flex: 1,
  },
  amount: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
