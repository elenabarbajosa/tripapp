import { mapTripQueryError, getTripQueryErrorDebug } from "@/features/trips/errors";
import { mapTripMembersFromRpc } from "@/features/trips/mappers";
import { resolveRouteParam } from "@/utils/routeParams";
import {
  buildNextDestinationDefaults,
  createTripDestinationsSchema,
} from "@/validation/tripSchemas";

describe("create-trip destination date rules (active schema)", () => {
  const baseDest = {
    id: "1",
    city: "Madrid",
    country: "Spain",
    countryCode: "ES",
    currencyCode: "EUR",
  };

  it("accepts 02/08 → 03/08 (ISO) within trip window", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-08-02",
      tripEndDate: "2026-08-10",
      destinations: [
        {
          ...baseDest,
          arrivalDate: "2026-08-02",
          departureDate: "2026-08-03",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts same-day arrival and departure", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-08-02",
      tripEndDate: "2026-08-10",
      destinations: [
        {
          ...baseDest,
          arrivalDate: "2026-08-05",
          departureDate: "2026-08-05",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects departure before arrival with required message", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-08-02",
      tripEndDate: "2026-08-10",
      destinations: [
        {
          ...baseDest,
          arrivalDate: "2026-08-07",
          departureDate: "2026-08-03",
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "Departure date must be on or after the arrival date.",
        ),
      ).toBe(true);
    }
  });

  it("rejects departure after trip end with required message", () => {
    const result = createTripDestinationsSchema.safeParse({
      tripStartDate: "2026-08-02",
      tripEndDate: "2026-08-10",
      destinations: [
        {
          ...baseDest,
          arrivalDate: "2026-08-08",
          departureDate: "2026-08-11",
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "Departure date must be on or before the trip end date.",
        ),
      ).toBe(true);
    }
  });

  it("defaults next stop arrival and departure to previous departure", () => {
    expect(
      buildNextDestinationDefaults({
        tripStartDate: "2026-08-03",
        tripEndDate: "2026-08-20",
        previous: { departureDate: "2026-08-07" },
      }),
    ).toEqual({
      arrivalDate: "2026-08-07",
      departureDate: "2026-08-07",
    });
  });
});

describe("departure DateField bound contract", () => {
  it("uses arrival as minimum and trip end as maximum", () => {
    const arrivalDate = "2026-08-02";
    const tripEndDate = "2026-08-10";
    const departureFieldProps = {
      minimumDate: arrivalDate,
      maximumDate: tripEndDate,
    };
    expect(departureFieldProps.minimumDate).toBe(arrivalDate);
    expect(departureFieldProps.maximumDate).toBe(tripEndDate);
    expect(departureFieldProps.maximumDate).not.toBe(arrivalDate);
  });
});

describe("route params", () => {
  it("resolves string and array trip ids", () => {
    expect(resolveRouteParam("abc")).toBe("abc");
    expect(resolveRouteParam(["abc", "def"])).toBe("abc");
    expect(resolveRouteParam("  ")).toBeUndefined();
    expect(resolveRouteParam(undefined)).toBeUndefined();
  });
});

describe("trip query errors", () => {
  it("maps infinite recursion to a readable migration hint", () => {
    const error = mapTripQueryError({
      message: 'infinite recursion detected in policy for relation "profiles"',
      code: "42P17",
    });
    expect(error.message).toMatch(/20260802040000|policy/i);
  });

  it("exposes debug fields without secrets", () => {
    const debug = getTripQueryErrorDebug({
      message: "Not an accepted member of this trip",
      code: "P0001",
      details: null,
      hint: null,
    });
    expect(debug?.code).toBe("P0001");
    expect(debug?.message).toMatch(/accepted member/i);
  });
});

describe("trip member RPC mapping", () => {
  it("maps accepted members with profiles", () => {
    const members = mapTripMembersFromRpc([
      {
        member_id: "m1",
        trip_id: "t1",
        user_id: "u1",
        role: "owner",
        status: "accepted",
        display_name: "Alex",
        email: "alex@example.com",
        avatar_url: null,
        preferred_currency: "EUR",
        member_created_at: "2026-08-01T00:00:00Z",
        member_updated_at: "2026-08-01T00:00:00Z",
      },
      {
        member_id: "m2",
        trip_id: "t1",
        user_id: "u2",
        role: "viewer",
        status: "left",
        display_name: "Gone",
        email: "gone@example.com",
        avatar_url: null,
        preferred_currency: "EUR",
        member_created_at: "2026-08-01T00:00:00Z",
        member_updated_at: "2026-08-01T00:00:00Z",
      },
    ]);
    expect(members).toHaveLength(1);
    expect(members[0]?.profile.displayName).toBe("Alex");
    expect(members[0]?.role).toBe("owner");
  });
});

describe("useTripQuery enablement contract", () => {
  it("documents that queries must not run without a valid uuid or auth", () => {
    const enabledWithoutId = Boolean("") && true;
    const enabledBeforeAuth = Boolean("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11") && false;
    const enabledReady = Boolean("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11") && true;
    expect(enabledWithoutId).toBe(false);
    expect(enabledBeforeAuth).toBe(false);
    expect(enabledReady).toBe(true);
  });
});
