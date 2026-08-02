import { Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/theme";
import { styles } from "./CurrencyField.styles";

export interface CurrencyFieldProps {
  label: string;
  currency: string;
  amount: string;
  onAmountChange?: (value: string) => void;
  onCurrencyPress?: () => void;
}

export function CurrencyField({
  label,
  currency,
  amount,
  onAmountChange,
  onCurrencyPress,
}: CurrencyFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Currency ${currency}`}
          onPress={onCurrencyPress}
          style={styles.currency}
        >
          <Text style={styles.currencyLabel}>{currency}</Text>
        </Pressable>
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={`${label} amount`}
          style={styles.amount}
        />
      </View>
    </View>
  );
}
