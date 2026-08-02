import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";

export const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  confirmed: {
    backgroundColor: colors.successSoft,
  },
  confirmedLabel: {
    color: colors.success,
  },
  tentative: {
    backgroundColor: colors.warningSoft,
  },
  tentativeLabel: {
    color: colors.warning,
  },
  invitation: {
    backgroundColor: colors.primarySoft,
  },
  invitationLabel: {
    color: colors.primary,
  },
  muted: {
    backgroundColor: colors.surfaceSecondary,
  },
  mutedLabel: {
    color: colors.textSecondary,
  },
});
