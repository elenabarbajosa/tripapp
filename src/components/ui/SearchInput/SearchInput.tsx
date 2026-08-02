import { TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, sizes } from "@/theme";
import { styles } from "./SearchInput.styles";

export interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search",
  accessibilityLabel = "Search",
}: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={sizes.iconMd} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={accessibilityLabel}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}
