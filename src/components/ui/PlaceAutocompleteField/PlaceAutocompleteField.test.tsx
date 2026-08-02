/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories need sync require() */
/* eslint-disable import/first -- mocks must register before the component import */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { PlaceSuggestion } from "@/features/places/types";

jest.mock("@/theme", () => ({
  colors: {
    primary: "#2563EB",
    primarySoft: "#EFF6FF",
    primaryBorder: "#BFDBFE",
    textPrimary: "#111",
    textSecondary: "#444",
    textMuted: "#666",
    border: "#ddd",
    error: "#DC2626",
    surface: "#fff",
  },
  spacing: { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16 },
  radii: { md: 12 },
  typography: {
    label: {},
    body: {},
    bodySmall: {},
    caption: {},
  },
  sizes: { inputHeight: 48, hairline: 1 },
}));

jest.mock("@/components/ui/AppTextInput/AppTextInput", () => {
  const React = require("react");
  const { TextInput, Text, View } = require("react-native");
  return {
    AppTextInput: ({
      label,
      value,
      onChangeText,
      onFocus,
      onBlur,
      placeholder,
      editable,
      errorText,
    }: {
      label?: string;
      value?: string;
      onChangeText?: (text: string) => void;
      onFocus?: () => void;
      onBlur?: () => void;
      placeholder?: string;
      editable?: boolean;
      errorText?: string;
    }) =>
      React.createElement(
        View,
        null,
        label ? React.createElement(Text, null, label) : null,
        React.createElement(TextInput, {
          value,
          onChangeText,
          onFocus,
          onBlur,
          placeholder,
          editable,
          accessibilityLabel: label ?? placeholder,
        }),
        errorText ? React.createElement(Text, null, errorText) : null,
      ),
  };
});

const mockSearch = jest.fn();

jest.mock("@/features/places/usePlaceAutocompleteSearch", () => ({
  usePlaceAutocompleteSearch: (...args: unknown[]) => mockSearch(...args),
}));

import { PlaceAutocompleteField } from "@/components/ui/PlaceAutocompleteField/PlaceAutocompleteField";

const suggestion: PlaceSuggestion = {
  placeId: "place-1",
  name: "Starbucks Reserve Roastery Chicago",
  formattedAddress: "Starbucks Reserve Roastery, Chicago",
  primaryText: "Starbucks Reserve Roastery Chicago",
  secondaryText: "Chicago, IL",
  latitude: 41.883,
  longitude: -87.647,
  countryCode: "US",
  resultType: "amenity",
  category: "catering",
};

describe("PlaceAutocompleteField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch.mockReturnValue({
      suggestions: [suggestion],
      isSearching: false,
      errorMessage: null,
      emptyMessage: null,
      attribution: "Powered by Geoapify",
    });
  });

  it("shows suggestions, attribution, and populates on select", async () => {
    const onPlaceSelected = jest.fn();
    const onManualTextChange = jest.fn();

    render(
      <PlaceAutocompleteField
        value="Star"
        address=""
        geoapifyPlaceId={null}
        latitude={null}
        longitude={null}
        onManualTextChange={onManualTextChange}
        onPlaceSelected={onPlaceSelected}
        onClearSelection={jest.fn()}
      />,
    );

    fireEvent(screen.getByPlaceholderText("Search a place or type manually"), "focus");

    await waitFor(() => {
      expect(screen.getByText("Starbucks Reserve Roastery Chicago")).toBeTruthy();
    });
    expect(screen.getByLabelText("Powered by Geoapify")).toBeTruthy();

    fireEvent.press(screen.getByText("Starbucks Reserve Roastery Chicago"));
    expect(onPlaceSelected).toHaveBeenCalledWith(suggestion);
  });

  it("preserves manual entry when API fails", async () => {
    mockSearch.mockReturnValue({
      suggestions: [],
      isSearching: false,
      errorMessage: "Location search is temporarily unavailable. You can enter it manually.",
      emptyMessage: null,
      attribution: "Powered by Geoapify",
    });

    const onManualTextChange = jest.fn();
    render(
      <PlaceAutocompleteField
        value="Custom cafe"
        address="123 Main"
        geoapifyPlaceId={null}
        latitude={null}
        longitude={null}
        onManualTextChange={onManualTextChange}
        onPlaceSelected={jest.fn()}
        onClearSelection={jest.fn()}
      />,
    );

    fireEvent(screen.getByDisplayValue("Custom cafe"), "focus");
    await waitFor(() => {
      expect(
        screen.getByText(
          "Location search is temporarily unavailable. You can enter it manually.",
        ),
      ).toBeTruthy();
    });
    expect(screen.getByDisplayValue("Custom cafe")).toBeTruthy();
    expect(screen.getByDisplayValue("123 Main")).toBeTruthy();
  });

  it("clears all location data from Clear", () => {
    const onClearSelection = jest.fn();
    render(
      <PlaceAutocompleteField
        value="Willis Tower"
        address="233 S Wacker"
        geoapifyPlaceId="place-1"
        latitude={41.8}
        longitude={-87.6}
        onManualTextChange={jest.fn()}
        onPlaceSelected={jest.fn()}
        onClearSelection={onClearSelection}
      />,
    );

    fireEvent.press(screen.getByLabelText("Clear location"));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("clears provider metadata when manually editing after selection", () => {
    const onManualTextChange = jest.fn();
    render(
      <PlaceAutocompleteField
        value="Willis Tower"
        address="233 S Wacker"
        geoapifyPlaceId="place-1"
        latitude={41.8}
        longitude={-87.6}
        onManualTextChange={onManualTextChange}
        onPlaceSelected={jest.fn()}
        onClearSelection={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText("Edit location"));
    expect(onManualTextChange).toHaveBeenCalledWith(
      expect.objectContaining({ clearProviderMetadata: true }),
    );
  });

  it("handles empty results", async () => {
    mockSearch.mockReturnValue({
      suggestions: [],
      isSearching: false,
      errorMessage: null,
      emptyMessage: "No matching locations found.",
      attribution: "Powered by Geoapify",
    });

    render(
      <PlaceAutocompleteField
        value="zzzz"
        address=""
        geoapifyPlaceId={null}
        latitude={null}
        longitude={null}
        onManualTextChange={jest.fn()}
        onPlaceSelected={jest.fn()}
        onClearSelection={jest.fn()}
      />,
    );
    fireEvent(screen.getByPlaceholderText("Search a place or type manually"), "focus");
    await waitFor(() => {
      expect(screen.getByText("No matching locations found.")).toBeTruthy();
    });
  });
});
