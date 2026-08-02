import { StyleSheet } from "react-native";
import { colors, radii, sizes, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: sizes.inputHeight,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
});
