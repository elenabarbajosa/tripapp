import { PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { styles } from "./BottomSheet.styles";

export interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  onClose: () => void;
}

/**
 * Lightweight modal bottom sheet for Phase 1.
 * Can be replaced with a gesture-driven sheet library later if needed.
 */
export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close sheet">
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
