import { Text, View } from "react-native";

import { styles } from "./StatusBadge.styles";

export type StatusBadgeVariant = "confirmed" | "tentative" | "invitation" | "muted";

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
}

const variantStyles = {
  confirmed: { container: styles.confirmed, label: styles.confirmedLabel },
  tentative: { container: styles.tentative, label: styles.tentativeLabel },
  invitation: { container: styles.invitation, label: styles.invitationLabel },
  muted: { container: styles.muted, label: styles.mutedLabel },
} as const;

export function StatusBadge({ label, variant = "muted" }: StatusBadgeProps) {
  const variantStyle = variantStyles[variant];

  return (
    <View style={[styles.badge, variantStyle.container]} accessibilityLabel={label}>
      <Text style={[styles.label, variantStyle.label]}>{label}</Text>
    </View>
  );
}
