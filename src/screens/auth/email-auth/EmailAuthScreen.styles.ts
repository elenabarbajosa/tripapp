import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.massive,
    gap: spacing.xl,
  },
  title: {
    ...typography.displayMedium,
  },
  body: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  errorBanner: {
    ...typography.body,
    color: colors.error,
    backgroundColor: colors.errorSoft,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  switchRow: {
    gap: spacing.sm,
    alignItems: "center",
  },
  switchPrompt: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  configMessage: {
    ...typography.body,
    color: colors.warning,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radii.md,
  },
});
