import * as AppleAuthentication from "expo-apple-authentication";

import { radii } from "@/theme";
import { styles } from "./AppleSignInButton.styles";

export interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Official Apple Authentication button.
 * Static visual props come from theme tokens via the styles file / radii.
 */
export function AppleSignInButton({ onPress, disabled = false }: AppleSignInButtonProps) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={radii.md}
      style={styles.button}
      onPress={disabled ? () => undefined : onPress}
    />
  );
}
