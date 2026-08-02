import { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { IconButton } from "@/components/ui/IconButton/IconButton";
import { colors } from "@/theme";
import { styles } from "./PasswordTextInput.styles";

export interface PasswordTextInputProps extends Omit<TextInputProps, "style" | "secureTextEntry"> {
  label?: string;
  errorText?: string;
}

export function PasswordTextInput({
  label,
  errorText,
  editable = true,
  ...props
}: PasswordTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.fieldRow,
          focused ? styles.fieldFocused : null,
          hasError ? styles.fieldError : null,
        ]}
      >
        <TextInput
          {...props}
          editable={editable}
          secureTextEntry={!visible}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={props.accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={styles.input}
        />
        <IconButton
          icon={visible ? "eye-off-outline" : "eye-outline"}
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          variant="ghost"
          onPress={() => setVisible((current) => !current)}
        />
      </View>
      {hasError ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}
