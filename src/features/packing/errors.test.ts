import { getPackingErrorDebug, mapPackingError } from "@/features/packing/errors";

describe("mapPackingError", () => {
  it("maps auth failures to a sign-in prompt", () => {
    expect(mapPackingError({ message: "JWT expired: not authenticated" }).message).toBe(
      "Sign in to view this packing list.",
    );
    expect(mapPackingError({ code: "PGRST301", message: "" }).message).toBe(
      "Sign in to view this packing list.",
    );
  });

  it("maps permission errors", () => {
    expect(
      mapPackingError({ code: "42501", message: "permission denied for table trip_packing_items" })
        .message,
    ).toBe("You do not have permission to change this packing item.");
    expect(
      mapPackingError({ message: "You cannot toggle this packing item" }).message,
    ).toBe("You do not have permission to change this packing item.");
  });

  it("maps duplicate reorder ids", () => {
    expect(
      mapPackingError({ message: "Duplicate packing item ids" }).message,
    ).toBe("Duplicate packing items are not allowed in the reorder list.");
  });

  it("maps items that do not belong to the trip", () => {
    expect(
      mapPackingError({ message: "One or more packing items do not belong to this trip" })
        .message,
    ).toBe("One or more packing items do not belong to this trip.");
  });

  it("falls back to the underlying message when short", () => {
    expect(mapPackingError({ message: "Item list is required" }).message).toBe(
      "Item list is required",
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(mapPackingError(null).message).toBe(
      "Unable to update packing list. Please try again.",
    );
    expect(mapPackingError("oops").message).toBe(
      "Unable to update packing list. Please try again.",
    );
  });

  it("extracts debug info without leaking when absent", () => {
    expect(getPackingErrorDebug(null)).toBeNull();
    expect(getPackingErrorDebug({ message: "boom", code: "500" })).toEqual({
      message: "boom",
      code: "500",
      details: undefined,
    });
  });
});
