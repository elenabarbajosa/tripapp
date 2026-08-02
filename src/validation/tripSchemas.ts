import { z } from "zod";

import { getCountryByCode } from "@/data/countries";
import { parseISODate } from "@/utils/date";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine((value) => {
    try {
      parseISODate(value);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid date");

const currencyCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"));

const countryCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/, "Select a country"))
  .refine((code) => getCountryByCode(code) !== null, "Select a valid country");

export const createTripBasicsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Trip name is required")
      .max(80, "Trip name must be 80 characters or fewer"),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    coverImageUrl: z
      .string()
      .trim()
      .refine((value) => value === "" || /^https?:\/\/.+/i.test(value), {
        message: "Enter a valid image URL",
      }),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const createTripDestinationItemSchema = z
  .object({
    id: z.string(),
    city: z.string().trim().min(1, "City is required").max(80),
    country: z.string().trim().min(1, "Country is required").max(80),
    countryCode: countryCodeSchema,
    currencyCode: currencyCodeSchema.nullable(),
    arrivalDate: isoDateSchema,
    departureDate: isoDateSchema,
  })
  .superRefine((values, ctx) => {
    if (!values.currencyCode) {
      ctx.addIssue({
        code: "custom",
        message: "Select a currency for this country",
        path: ["currencyCode"],
      });
    }
    if (values.departureDate < values.arrivalDate) {
      ctx.addIssue({
        code: "custom",
        message: "Departure date must be on or after the arrival date.",
        path: ["departureDate"],
      });
    }
  });

/**
 * Destination date window:
 * tripStartDate <= arrivalDate <= departureDate <= tripEndDate
 */
export const createTripDestinationsSchema = z
  .object({
    tripStartDate: isoDateSchema,
    tripEndDate: isoDateSchema,
    destinations: z
      .array(createTripDestinationItemSchema)
      .min(1, "Add at least one destination"),
  })
  .superRefine((values, ctx) => {
    values.destinations.forEach((destination, index) => {
      const arrivalOutsideTrip =
        destination.arrivalDate < values.tripStartDate ||
        destination.arrivalDate > values.tripEndDate;
      if (arrivalOutsideTrip) {
        ctx.addIssue({
          code: "custom",
          message: "Arrival date must be within the trip dates.",
          path: ["destinations", index, "arrivalDate"],
        });
      }
      if (destination.departureDate < destination.arrivalDate) {
        ctx.addIssue({
          code: "custom",
          message: "Departure date must be on or after the arrival date.",
          path: ["destinations", index, "departureDate"],
        });
      } else if (destination.departureDate > values.tripEndDate) {
        ctx.addIssue({
          code: "custom",
          message: "Departure date must be on or before the trip end date.",
          path: ["destinations", index, "departureDate"],
        });
      }
    });
  });

export type CreateTripBasicsValues = z.infer<typeof createTripBasicsSchema>;
export type CreateTripDestinationItemValues = z.infer<typeof createTripDestinationItemSchema>;
export type CreateTripDestinationsValues = z.infer<typeof createTripDestinationsSchema>;

/**
 * Prefill the next stop from the previous destination's departure.
 * Both arrival and departure default to that handoff day (same-day transitions are valid).
 */
export function buildNextDestinationDefaults(input: {
  tripStartDate: string;
  tripEndDate: string;
  previous?: Pick<CreateTripDestinationItemValues, "departureDate"> | null;
}): Pick<CreateTripDestinationItemValues, "arrivalDate" | "departureDate"> {
  const candidate = input.previous?.departureDate || input.tripStartDate;
  const clamped =
    candidate < input.tripStartDate
      ? input.tripStartDate
      : candidate > input.tripEndDate
        ? input.tripEndDate
        : candidate;
  return { arrivalDate: clamped, departureDate: clamped };
}
