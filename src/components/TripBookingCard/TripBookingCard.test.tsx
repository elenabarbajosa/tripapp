/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories need sync require() */
/* eslint-disable import/first -- mocks must register before the component import */

import { fireEvent, render, screen } from "@testing-library/react-native";

import type { TripBooking } from "@/types/models";

jest.mock("@/theme", () => {
  const colors = {
    background: "#fff",
    surface: "#fff",
    surfaceSecondary: "#f1f5f9",
    textPrimary: "#111",
    textSecondary: "#444",
    textMuted: "#666",
    border: "#ddd",
    primary: "#2563EB",
    primarySoft: "#DBEAFE",
    error: "#DC2626",
  };
  return {
    colors,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, massive: 48 },
    radii: { sm: 8, md: 12, lg: 16, full: 999 },
    sizes: { hairline: 1, iconLg: 24 },
    typography: {
      body: {},
      bodySmall: {},
      caption: {},
      label: {},
      headingSmall: {},
      title: {},
    },
    shadows: {},
  };
});

jest.mock("@/components/ui/AppButton/AppButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    AppButton: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress?: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: Boolean(disabled) },
          disabled,
          onPress,
        },
        React.createElement(Text, null, label),
      ),
  };
});

jest.mock("@/utils/bookingType", () => ({
  getTripBookingTypeColor: () => "#7C3AED",
  getTripBookingTypeLabel: (type: string) => type,
}));

jest.mock("@/utils/date", () => ({
  formatDisplayDate: (value: string) => value,
  formatShortDate: (value: string) => value,
  formatTimeLabel: (value: string) => value,
}));

import { TripBookingCard } from "@/components/TripBookingCard/TripBookingCard";

const booking: TripBooking = {
  id: "11111111-1111-4111-8111-111111111111",
  tripId: "22222222-2222-4222-8222-222222222222",
  createdBy: "33333333-3333-4333-8333-333333333333",
  bookingType: "accommodation",
  title: "Hotel Amara",
  providerName: "Amara Hotels",
  confirmationNumber: "CONF123",
  bookingReference: null,
  status: null,
  startDate: "2026-09-12",
  startTime: null,
  endDate: "2026-09-15",
  endTime: null,
  locationName: "Hotel Amara",
  address: null,
  geoapifyPlaceId: null,
  latitude: null,
  longitude: null,
  departureLocation: null,
  arrivalLocation: null,
  carrierName: null,
  transportNumber: null,
  terminal: null,
  gate: null,
  checkInTime: null,
  checkOutTime: null,
  notes: null,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
};

describe("TripBookingCard", () => {
  it("shows key booking details", () => {
    render(<TripBookingCard booking={booking} />);
    expect(screen.getAllByText("Hotel Amara").length).toBeGreaterThan(0);
    expect(screen.getByText("Amara Hotels")).toBeTruthy();
    expect(screen.getByText("Confirmation CONF123")).toBeTruthy();
  });

  it("hides management controls for viewers", () => {
    render(<TripBookingCard booking={booking} />);
    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.queryByText("Delete")).toBeNull();
  });

  it("shows owner/editor controls and invokes handlers", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <TripBookingCard
        booking={booking}
        canEdit
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.press(screen.getByText("Edit"));
    fireEvent.press(screen.getByText("Delete"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("invokes onPress when the card is tapped", () => {
    const onPress = jest.fn();
    render(<TripBookingCard booking={booking} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText(/Hotel Amara/));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
