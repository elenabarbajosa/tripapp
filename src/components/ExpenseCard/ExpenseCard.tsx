import { Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard/AppCard";
import { formatCurrency } from "@/utils/currency";
import { styles } from "./ExpenseCard.styles";

export interface ExpenseCardProps {
  description: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  dateLabel: string;
}

export function ExpenseCard({
  description,
  amount,
  currency,
  category,
  paidBy,
  dateLabel,
}: ExpenseCardProps) {
  return (
    <AppCard accessibilityLabel={`${description}, ${formatCurrency(amount, currency)}`}>
      <View style={styles.row}>
        <Text style={styles.title}>{description}</Text>
        <Text style={styles.amount}>{formatCurrency(amount, currency)}</Text>
      </View>
      <Text style={styles.meta}>
        {category} · Paid by {paidBy} · {dateLabel}
      </Text>
    </AppCard>
  );
}
