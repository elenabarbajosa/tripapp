import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SearchInput } from "@/components/ui/SearchInput/SearchInput";
import {
  formatCurrencyLabel,
  getCountryByCode,
  searchCountries,
  type CountryOption,
} from "@/data/countries";
import { colors, sizes } from "@/theme";
import { styles } from "./CountryPickerField.styles";

export interface CountryPickerFieldProps {
  label: string;
  countryCode?: string | null;
  errorText?: string;
  onSelect: (country: CountryOption) => void;
}

export function CountryPickerField({
  label,
  countryCode,
  errorText,
  onSelect,
}: CountryPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = countryCode ? getCountryByCode(countryCode) : null;
  const results = useMemo(() => searchCountries(query), [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selected
            ? `${label}, ${selected.name}, ${selected.countryCode}`
            : `${label}, select country`
        }
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.field, errorText ? styles.fieldError : null]}
      >
        {selected ? (
          <>
            <Text style={styles.flag} accessibilityElementsHidden>
              {selected.flag}
            </Text>
            <View style={styles.fieldTextBlock}>
              <Text style={styles.fieldTitle}>{selected.name}</Text>
              <Text style={styles.fieldMeta}>{selected.countryCode}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Select a country</Text>
        )}
        <Ionicons name="chevron-down" size={sizes.iconMd} color={colors.textMuted} />
      </Pressable>

      {selected && formatCurrencyLabel(selected) ? (
        <Text style={styles.currencyHint}>{formatCurrencyLabel(selected)}</Text>
      ) : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close country picker"
              onPress={close}
              hitSlop={8}
            >
              <Ionicons name="close" size={sizes.iconLg} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or code"
              accessibilityLabel="Search countries"
            />
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => item.countryCode}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No countries match “{query.trim()}”.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.countryCode === selected?.countryCode;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.countryCode}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onSelect(item);
                    close();
                  }}
                  style={[styles.row, isSelected ? styles.rowSelected : null]}
                >
                  <Text style={styles.flag} accessibilityElementsHidden>
                    {item.flag}
                  </Text>
                  <View style={styles.rowTextBlock}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>
                      {item.countryCode}
                      {item.currencyCode ? ` · ${item.currencyCode}` : ""}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={sizes.iconMd} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
