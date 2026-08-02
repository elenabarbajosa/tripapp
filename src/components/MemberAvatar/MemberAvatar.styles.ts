import { StyleSheet } from "react-native";
import { colors, radii, sizes, typography } from "@/theme";

export const styles = StyleSheet.create({
  avatar: {
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: sizes.hairline,
    borderColor: colors.surface,
  },
  sm: {
    width: sizes.avatarSm,
    height: sizes.avatarSm,
  },
  md: {
    width: sizes.avatarMd,
    height: sizes.avatarMd,
  },
  lg: {
    width: sizes.avatarLg,
    height: sizes.avatarLg,
  },
  xl: {
    width: sizes.avatarXl,
    height: sizes.avatarXl,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    ...typography.label,
    color: colors.primary,
  },
  initialsLg: {
    ...typography.headingSmall,
    color: colors.primary,
  },
});
