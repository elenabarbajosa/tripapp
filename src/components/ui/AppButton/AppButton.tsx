import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors } from "@/theme";
import { styles } from "./AppButton.styles";
import type { AppButtonProps } from "./AppButton.types";

const labelStyleByVariant = {
  primary: styles.labelPrimary,
  secondary: styles.labelSecondary,
  ghost: styles.labelGhost,
  destructive: styles.labelDestructive,
} as const;

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  accessibilityLabel,
  fullWidth = true,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        size === "sm" ? styles.sm : null,
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        pressed && variant === "primary" ? { backgroundColor: colors.primaryPressed } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.onPrimary : colors.primary}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text style={[styles.label, labelStyleByVariant[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}
