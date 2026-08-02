/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories need sync require() */
/* eslint-disable import/first -- mocks must register before the component import */

import { fireEvent, render, screen } from "@testing-library/react-native";

import type { TripActivity } from "@/types/models";

jest.mock("@/theme", () => {
  const colors = {
    background: "#fff",
    surface: "#fff",
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
    radii: { md: 12, lg: 16 },
    typography: {
      body: {},
      bodySmall: {},
      caption: {},
      title: {},
    },
    shadows: {},
    sizes: { iconLg: 24 },
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

jest.mock("@/components/ui/IconButton/IconButton", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    IconButton: ({
      accessibilityLabel,
      onPress,
      disabled,
    }: {
      accessibilityLabel: string;
      onPress?: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(Pressable, {
        accessibilityRole: "button",
        accessibilityLabel,
        accessibilityState: { disabled: Boolean(disabled) },
        disabled,
        onPress,
      }),
  };
});

jest.mock("@/utils/itineraryCategory", () => ({
  getTripActivityCategoryColor: () => "#0D9488",
  getTripActivityCategoryLabel: (category: string) => category,
}));

jest.mock("@/utils/date", () => ({
  formatTimeLabel: (value: string) => value,
}));

import { ItineraryActivityCard } from "@/components/ItineraryActivityCard/ItineraryActivityCard";

const activity: TripActivity = {
  id: "11111111-1111-4111-8111-111111111111",
  tripId: "22222222-2222-4222-8222-222222222222",
  tripDayId: "33333333-3333-4333-8333-333333333333",
  destinationId: null,
  createdBy: "44444444-4444-4444-8444-444444444444",
  title: "Miradouro",
  description: "Sunset views over the city.",
  category: "sightseeing",
  isAllDay: false,
  startTime: "18:00",
  endTime: "19:00",
  locationName: "Viewpoint",
  address: null,
  geoapifyPlaceId: null,
  latitude: null,
  longitude: null,
  notes: null,
  position: 0,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
  destinationCity: "Lisbon",
};

describe("ItineraryActivityCard", () => {
  it("hides management controls for viewers", () => {
    render(<ItineraryActivityCard activity={activity} />);
    expect(screen.queryByText("Edit")).toBeNull();
    expect(screen.queryByText("Delete")).toBeNull();
    expect(screen.queryByLabelText("Move activity up")).toBeNull();
    expect(screen.queryByLabelText("Move activity down")).toBeNull();
  });

  it("shows owner/editor controls", () => {
    render(
      <ItineraryActivityCard
        activity={activity}
        canEdit
        canDelete
        canReorder
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
      />,
    );
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
    expect(screen.getByLabelText("Move activity up")).toBeTruthy();
    expect(screen.getByLabelText("Move activity down")).toBeTruthy();
  });

  it("disables move controls at list boundaries", () => {
    render(
      <ItineraryActivityCard
        activity={activity}
        canReorder
        isFirst
        isLast
        onMoveUp={jest.fn()}
        onMoveDown={jest.fn()}
      />,
    );
    expect(screen.getByLabelText("Move activity up").props.accessibilityState?.disabled).toBe(
      true,
    );
    expect(screen.getByLabelText("Move activity down").props.accessibilityState?.disabled).toBe(
      true,
    );
  });

  it("invokes edit and delete handlers (delete confirmation is owned by the screen)", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <ItineraryActivityCard
        activity={activity}
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
});
