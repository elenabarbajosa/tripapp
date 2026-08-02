export type AppButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type AppButtonSize = "md" | "sm";

export interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  fullWidth?: boolean;
}
