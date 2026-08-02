import { useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

import { colors } from "@/theme";
import { styles } from "./AppTextInput.styles";

export interface AppTextInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export function AppTextInput({
  label,
  helperText,
  errorText,
  editable = true,
  ...props
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        editable={editable}
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
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          hasError ? styles.inputError : null,
        ]}
      />
      {hasError ? <Text style={styles.error}>{errorText}</Text> : null}
      {!hasError && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}
