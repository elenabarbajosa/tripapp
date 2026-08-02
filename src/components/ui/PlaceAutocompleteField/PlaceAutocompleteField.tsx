import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { usePlaceAutocompleteSearch } from "@/features/places/usePlaceAutocompleteSearch";
import type { PlaceSuggestion } from "@/features/places/types";
import { colors } from "@/theme";
import { styles } from "./PlaceAutocompleteField.styles";

export interface PlaceAutocompleteFieldValue {
  locationName: string | null;
  address: string | null;
  geoapifyPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PlaceAutocompleteFieldProps {
  label?: string;
  value: string;
  address: string;
  geoapifyPlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  countryCode?: string | null;
  language?: string | null;
  errorText?: string;
  disabled?: boolean;
  onManualTextChange: (next: {
    locationName: string;
    address?: string;
    clearProviderMetadata: boolean;
  }) => void;
  onPlaceSelected: (suggestion: PlaceSuggestion) => void;
  onClearSelection: () => void;
}

function hasConfirmedPlace(
  placeId: string | null,
  latitude: number | null,
  longitude: number | null,
): boolean {
  return (
    typeof placeId === "string" &&
    placeId.trim().length > 0 &&
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function PlaceAutocompleteField({
  label = "Location",
  value,
  address,
  geoapifyPlaceId,
  latitude,
  longitude,
  countryCode,
  language,
  errorText,
  disabled = false,
  onManualTextChange,
  onPlaceSelected,
  onClearSelection,
}: PlaceAutocompleteFieldProps) {
  const [focused, setFocused] = useState(false);

  const confirmed = hasConfirmedPlace(geoapifyPlaceId, latitude, longitude);
  const searchEnabled = !disabled && focused && !confirmed;

  const { suggestions, isSearching, errorMessage, emptyMessage, attribution } =
    usePlaceAutocompleteSearch({
      query: value,
      countryCode,
      language,
      enabled: searchEnabled,
    });

  const showSuggestions =
    searchEnabled &&
    value.trim().length >= 3 &&
    (isSearching ||
      suggestions.length > 0 ||
      errorMessage != null ||
      emptyMessage != null);

  const hasLocationContent =
    value.trim().length > 0 || address.trim().length > 0 || confirmed;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {confirmed ? (
        <View
          style={styles.selectedCard}
          accessibilityLabel={`Selected location ${value}. ${address}`}
        >
          <Text style={styles.selectedBadge}>Selected place</Text>
          <Text style={styles.selectedTitle}>{value || "Selected location"}</Text>
          {address ? <Text style={styles.selectedAddress}>{address}</Text> : null}
          <View style={styles.inputRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit location"
              disabled={disabled}
              onPress={() => {
                setFocused(true);
                onManualTextChange({
                  locationName: value,
                  clearProviderMetadata: true,
                });
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearLabel}>Edit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear location"
              disabled={disabled}
              onPress={() => {
                onClearSelection();
                setFocused(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearLabel}>Clear</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <AppTextInput
                placeholder="Search a place or type manually"
                value={value}
                editable={!disabled}
                onChangeText={(text) => {
                  onManualTextChange({
                    locationName: text,
                    clearProviderMetadata: true,
                  });
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setFocused(false);
                  }, 180);
                }}
                errorText={errorText}
                autoCapitalize="sentences"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
            {hasLocationContent ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear location"
                disabled={disabled}
                onPress={() => {
                  onClearSelection();
                  setFocused(false);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearLabel}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.addressField}>
            <AppTextInput
              label="Address"
              placeholder="Street address (optional)"
              value={address}
              editable={!disabled}
              onChangeText={(text) => {
                onManualTextChange({
                  locationName: value,
                  address: text,
                  clearProviderMetadata: true,
                });
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  setFocused(false);
                }, 180);
              }}
              autoCapitalize="sentences"
            />
          </View>
        </>
      )}

      {showSuggestions ? (
        <View style={styles.suggestions} accessibilityLabel="Location suggestions">
          {isSearching ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.statusText}>Searching locations…</Text>
            </View>
          ) : null}

          {!isSearching && errorMessage ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {errorMessage}
            </Text>
          ) : null}

          {!isSearching && !errorMessage && emptyMessage ? (
            <Text style={styles.statusText} accessibilityLiveRegion="polite">
              {emptyMessage}
            </Text>
          ) : null}

          {!isSearching
            ? suggestions.map((suggestion, index) => {
                const isLast = index === suggestions.length - 1;
                return (
                  <Pressable
                    key={suggestion.placeId}
                    accessibilityRole="button"
                    accessibilityLabel={`${suggestion.primaryText}${
                      suggestion.secondaryText ? `, ${suggestion.secondaryText}` : ""
                    }`}
                    disabled={disabled}
                    onPress={() => {
                      onPlaceSelected(suggestion);
                      setFocused(false);
                    }}
                    style={[styles.suggestionRow, isLast ? styles.suggestionRowLast : null]}
                  >
                    <Text style={styles.suggestionPrimary}>{suggestion.primaryText}</Text>
                    {suggestion.secondaryText ? (
                      <Text style={styles.suggestionSecondary}>
                        {suggestion.secondaryText}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })
            : null}

          {(suggestions.length > 0 || isSearching) && !errorMessage ? (
            <Text
              style={styles.attribution}
              accessibilityLabel="Powered by Geoapify"
              accessibilityRole="text"
            >
              {attribution || "Powered by Geoapify"}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
