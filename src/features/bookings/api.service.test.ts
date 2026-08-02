import { mapBookingError } from "@/features/bookings/errors";
import {
  createTripBooking,
  getTripBookings,
  updateTripBooking,
} from "@/features/bookings/api";

const tripId = "11111111-1111-4111-8111-111111111111";
const bookingId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";

const mockFrom = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/services/supabase", () => ({
  requireSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

function chain(result: { data?: unknown; error?: unknown | null }) {
  const builder: Record<string, unknown> = {};
  const methods = ["select", "eq", "insert", "update", "delete", "single", "maybeSingle"];
  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: bookingId,
    trip_id: tripId,
    created_by: userId,
    booking_type: "accommodation",
    title: "Hotel Amara",
    provider_name: null,
    confirmation_number: null,
    booking_reference: null,
    status: null,
    start_date: "2026-09-12",
    start_time: null,
    end_date: "2026-09-15",
    end_time: null,
    location_name: "Hotel Amara",
    address: null,
    geoapify_place_id: null,
    latitude: null,
    longitude: null,
    departure_location: null,
    arrival_location: null,
    carrier_name: null,
    transport_number: null,
    terminal: null,
    gate: null,
    check_in_time: null,
    check_out_time: null,
    notes: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("bookings api service behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and maps trip bookings", async () => {
    mockFrom.mockImplementation(() =>
      chain({ data: [bookingRow()], error: null }),
    );

    const bookings = await getTripBookings(tripId);
    expect(bookings).toHaveLength(1);
    expect(bookings[0]?.title).toBe("Hotel Amara");
    expect(bookings[0]?.bookingType).toBe("accommodation");
  });

  it("creates a booking using the authenticated user id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    mockFrom.mockImplementation(() => chain({ data: bookingRow(), error: null }));

    const created = await createTripBooking({
      tripId,
      bookingType: "accommodation",
      title: "Hotel Amara",
    });

    expect(created.createdBy).toBe(userId);
    expect(created.title).toBe("Hotel Amara");
  });

  it("requires sign-in to create a booking", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      createTripBooking({ tripId, bookingType: "accommodation", title: "Hotel" }),
    ).rejects.toThrow("Sign in to add a booking.");
  });

  it("maps permission denial on update", async () => {
    mockFrom.mockImplementation(() =>
      chain({
        data: null,
        error: { code: "42501", message: "permission denied", details: "", hint: "" },
      }),
    );

    await expect(
      updateTripBooking({ tripId, bookingId, title: "New title" }),
    ).rejects.toThrow("You do not have permission to change this booking.");
  });

  it("maps unknown errors through mapBookingError", () => {
    expect(mapBookingError({ message: "custom failure" }).message).toBe("custom failure");
  });
});
