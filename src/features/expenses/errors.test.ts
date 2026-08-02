import { getExpenseErrorDebug, mapExpenseError } from "@/features/expenses/errors";

describe("mapExpenseError", () => {
  it("maps auth failures to a sign-in prompt", () => {
    expect(mapExpenseError({ message: "JWT expired: not authenticated" }).message).toBe(
      "Sign in to view expenses.",
    );
    expect(mapExpenseError({ code: "PGRST301", message: "" }).message).toBe(
      "Sign in to view expenses.",
    );
  });

  it("maps permission errors", () => {
    expect(
      mapExpenseError({ code: "42501", message: "permission denied for table trip_expenses" })
        .message,
    ).toBe("You do not have permission to change this expense.");
  });

  it("maps check constraint violations", () => {
    expect(
      mapExpenseError({
        code: "23514",
        message: 'violates check constraint "trip_expenses_amount_positive"',
      }).message,
    ).toBe("Amount must be positive.");
    expect(
      mapExpenseError({
        code: "23514",
        message: 'violates check constraint "trip_expenses_currency_code"',
      }).message,
    ).toBe("Currency code must be ISO 4217.");
    expect(
      mapExpenseError({
        code: "23514",
        message: 'violates check constraint "trip_settlements_different_parties"',
      }).message,
    ).toBe("Payer and payee must be different.");
  });

  it("maps foreign key violations", () => {
    expect(
      mapExpenseError({ code: "23503", message: "violates foreign key constraint" }).message,
    ).toBe("That trip is no longer available.");
  });

  it("maps missing rows", () => {
    expect(mapExpenseError({ code: "PGRST116", message: "contains 0 rows" }).message).toBe(
      "Expense not found.",
    );
  });

  it("passes through short custom RPC exception messages", () => {
    expect(mapExpenseError({ message: "Only owners and editors can manage expenses" }).message).toBe(
      "Only owners and editors can manage expenses",
    );
    expect(mapExpenseError({ message: "Percentages must total 100" }).message).toBe(
      "Percentages must total 100",
    );
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(mapExpenseError(null).message).toBe("Unable to load expenses. Please try again.");
    expect(mapExpenseError("oops").message).toBe("Unable to load expenses. Please try again.");
  });

  it("extracts debug info without leaking when absent", () => {
    expect(getExpenseErrorDebug(null)).toBeNull();
    expect(getExpenseErrorDebug({ message: "boom", code: "500" })).toEqual({
      message: "boom",
      code: "500",
      details: undefined,
      hint: undefined,
    });
  });
});
