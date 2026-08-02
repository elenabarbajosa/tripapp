import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlap: {
    marginLeft: -spacing.sm,
  },
  count: {
    marginLeft: spacing.sm,
    ...typography.caption,
    color: colors.textSecondary,
  },
});
