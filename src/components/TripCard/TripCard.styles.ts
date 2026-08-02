import { StyleSheet } from "react-native";
import { colors, radii, shadows, spacing, sizes, typography } from "@/theme";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  mutedCard: {
    opacity: 0.85,
    ...shadows.sm,
  },
  image: {
    width: "100%",
    height: sizes.tripCardImageHeight,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.headingMedium,
  },
  destinations: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  dates: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  countdown: {
    ...typography.label,
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  travellers: {
    ...typography.caption,
  },
});
