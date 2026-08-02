import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, sizes } from "@/theme";
import { formatDisplayDate } from "@/utils/date";
import { styles } from "./DateField.styles";

export interface DateFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress?: () => void;
}

/**
 * Phase 1: presentation-only date field.
 * Native date pickers arrive with form flows in later phases.
 */
export function DateField({
  label,
  value,
  placeholder = "Select date",
  onPress,
}: DateFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${formatDisplayDate(value)}` : ""}`}
        onPress={onPress}
        style={styles.field}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={sizes.iconMd} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
