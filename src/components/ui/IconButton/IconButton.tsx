import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, sizes } from "@/theme";
import { styles } from "./IconButton.styles";

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: "default" | "ghost";
  color?: string;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "default",
  color = colors.textPrimary,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "ghost" ? styles.ghost : null,
        pressed ? { opacity: 0.7 } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      <Ionicons name={icon} size={sizes.iconLg} color={color} />
    </Pressable>
  );
}
