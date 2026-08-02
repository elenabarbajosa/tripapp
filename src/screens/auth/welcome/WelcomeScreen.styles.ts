import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.massive,
    paddingBottom: spacing.xxxl,
    justifyContent: "space-between",
  },
  hero: {
    gap: spacing.lg,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  brandMarkText: {
    ...typography.headingLarge,
    color: colors.onPrimary,
  },
  brand: {
    ...typography.brand,
    color: colors.textPrimary,
  },
  headline: {
    ...typography.displayMedium,
    color: colors.textPrimary,
  },
  supporting: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    maxWidth: 320,
  },
  actions: {
    gap: spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerNote: {
    ...typography.caption,
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
