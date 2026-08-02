import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
// eslint-disable-next-line import/no-named-as-default -- Expo community picker default export
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Ionicons } from "@expo/vector-icons";

import { colors, sizes } from "@/theme";
import {
  formatLocalDisplayDate,
  isoDateToPickerDate,
  maskDisplayDateInput,
  parseDisplayDateToISO,
  pickerDateToISODate,
} from "@/utils/dateOnly";
import { styles } from "./DateField.styles";

export interface DateFieldProps {
  label: string;
  /** Controlled ISO date-only value (YYYY-MM-DD). */
  value?: string | null;
  placeholder?: string;
  errorText?: string;
  helperText?: string;
  minimumDate?: string | null;
  maximumDate?: string | null;
  onChangeISO: (isoDate: string) => void;
  onBlur?: () => void;
}

function resolveInitialPickerDate(
  value: string | null | undefined,
  minimumDate?: string | null,
  maximumDate?: string | null,
): Date {
  try {
    if (value) {
      return isoDateToPickerDate(value);
    }
  } catch {
    // fall through
  }
  try {
    if (minimumDate) {
      return isoDateToPickerDate(minimumDate);
    }
  } catch {
    // fall through
  }
  try {
    if (maximumDate) {
      return isoDateToPickerDate(maximumDate);
    }
  } catch {
    // fall through
  }
  return new Date();
}

export function DateField({
  label,
  value,
  placeholder = "DD/MM/YYYY",
  errorText,
  helperText,
  minimumDate,
  maximumDate,
  onChangeISO,
  onBlur,
}: DateFieldProps) {
  const [draftText, setDraftText] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date>(() =>
    resolveInitialPickerDate(value, minimumDate, maximumDate),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const displayText =
    draftText !== null ? draftText : value ? formatLocalDisplayDate(value) : "";

  const minimumPickerDate = minimumDate ? isoDateToPickerDate(minimumDate) : undefined;
  const maximumPickerDate = maximumDate ? isoDateToPickerDate(maximumDate) : undefined;

  const openPicker = () => {
    setPendingDate(resolveInitialPickerDate(value, minimumDate, maximumDate));
    setShowPicker(true);
  };

  const cancelPicker = () => {
    setShowPicker(false);
  };

  const confirmPicker = () => {
    const iso = pickerDateToISODate(pendingDate);
    if (minimumDate && iso < minimumDate) {
      setLocalError(`Date must be on or after ${formatLocalDisplayDate(minimumDate)}`);
      return;
    }
    if (maximumDate && iso > maximumDate) {
      setLocalError(`Date must be on or before ${formatLocalDisplayDate(maximumDate)}`);
      return;
    }
    setLocalError(null);
    onChangeISO(iso);
    setDraftText(null);
    setShowPicker(false);
  };

  const commitTypedValue = (text: string) => {
    try {
      const iso = parseDisplayDateToISO(text);
      if (!iso) {
        setLocalError("Enter a date");
        return;
      }
      if (minimumDate && iso < minimumDate) {
        setLocalError(`Date must be on or after ${formatLocalDisplayDate(minimumDate)}`);
        return;
      }
      if (maximumDate && iso > maximumDate) {
        setLocalError(`Date must be on or before ${formatLocalDisplayDate(maximumDate)}`);
        return;
      }
      setLocalError(null);
      onChangeISO(iso);
      setDraftText(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Enter a valid date");
    }
  };

  const combinedError = errorText ?? localError;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          combinedError ? styles.fieldError : null,
        ]}
      >
        <TextInput
          value={displayText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          keyboardType="number-pad"
          onFocus={() => {
            setFocused(true);
            setDraftText(displayText);
          }}
          onBlur={() => {
            setFocused(false);
            commitTypedValue(draftText ?? displayText);
            onBlur?.();
          }}
          onChangeText={(text) => {
            setDraftText(maskDisplayDateInput(text));
            setLocalError(null);
          }}
          style={styles.textInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open calendar for ${label}`}
          onPress={openPicker}
          style={styles.calendarButton}
          hitSlop={8}
        >
          <Ionicons name="calendar-outline" size={sizes.iconMd} color={colors.primary} />
        </Pressable>
      </View>
      {combinedError ? <Text style={styles.error}>{combinedError}</Text> : null}
      {!combinedError && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}

      {Platform.OS === "android" && showPicker ? (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          presentation="dialog"
          accentColor={colors.primary}
          minimumDate={minimumPickerDate}
          maximumDate={maximumPickerDate}
          onValueChange={(_event, selectedDate) => {
            setPendingDate(selectedDate);
            const iso = pickerDateToISODate(selectedDate);
            if (minimumDate && iso < minimumDate) {
              setLocalError(`Date must be on or after ${formatLocalDisplayDate(minimumDate)}`);
              setShowPicker(false);
              return;
            }
            if (maximumDate && iso > maximumDate) {
              setLocalError(`Date must be on or before ${formatLocalDisplayDate(maximumDate)}`);
              setShowPicker(false);
              return;
            }
            setLocalError(null);
            onChangeISO(iso);
            setDraftText(null);
            setShowPicker(false);
          }}
          onDismiss={cancelPicker}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={cancelPicker}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={cancelPicker}
              accessibilityLabel="Cancel date picker"
            />
            <View style={styles.iosSheet}>
              <View style={styles.iosSheetHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  onPress={cancelPicker}
                  hitSlop={8}
                >
                  <Text style={styles.iosSheetAction}>Cancel</Text>
                </Pressable>
                <Text style={styles.iosSheetTitle}>{label}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  onPress={confirmPicker}
                  hitSlop={8}
                >
                  <Text style={styles.iosSheetActionPrimary}>Done</Text>
                </Pressable>
              </View>
              <Text style={styles.iosSheetSelected}>
                Selected: {formatLocalDisplayDate(pickerDateToISODate(pendingDate))}
              </Text>
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={pendingDate}
                  mode="date"
                  display="inline"
                  accentColor={colors.primary}
                  minimumDate={minimumPickerDate}
                  maximumDate={maximumPickerDate}
                  onValueChange={(_event, selectedDate) => {
                    // Keep the sheet open while browsing months / tapping days.
                    setPendingDate(selectedDate);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
