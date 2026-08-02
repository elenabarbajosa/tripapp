import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, sizes } from "@/theme";
import { formatTimeLabel } from "@/utils/date";
import { styles } from "./TimeField.styles";

export interface TimeFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress?: () => void;
}

export function TimeField({
  label,
  value,
  placeholder = "Select time",
  onPress,
}: TimeFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${formatTimeLabel(value)}` : ""}`}
        onPress={onPress}
        style={styles.field}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatTimeLabel(value) : placeholder}
        </Text>
        <Ionicons name="time-outline" size={sizes.iconMd} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
