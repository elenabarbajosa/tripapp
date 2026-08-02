import { z } from "zod";

import { parseDisplayDateToISO } from "@/utils/dateOnly";
import { compareTimes, isValidTimeHHmm } from "@/utils/time";

const TRIP_BOOKING_TYPE_VALUES = [
  "accommodation",
  "flight",
  "train",
  "bus",
  "car_rental",
  "restaurant",
  "activity",
  "other",
] as const;

const optionalNullableText = (max: number, label: string) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    })
    .pipe(
      z.union([
        z.null(),
        z.string().max(max, `${label} must be ${max} characters or fewer`),
      ]),
    );

/** DD/MM/YYYY display text -> ISO YYYY-MM-DD, or null when blank. */
const dateFieldSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    try {
      return parseDisplayDateToISO(trimmed);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid date",
      });
      return z.NEVER;
    }
  });

const timeFieldSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .pipe(
    z.union([
      z.null(),
      z.string().refine(isValidTimeHHmm, {
        message: "Use HH:mm format (e.g. 09:30)",
      }),
    ]),
  );

const optionalLatitude = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value == null || Number.isNaN(value) ? null : value))
  .pipe(
    z.union([
      z.null(),
      z
        .number()
        .min(-90, "Latitude must be between -90 and 90")
        .max(90, "Latitude must be between -90 and 90"),
    ]),
  );

const optionalLongitude = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (value == null || Number.isNaN(value) ? null : value))
  .pipe(
    z.union([
      z.null(),
      z
        .number()
        .min(-180, "Longitude must be between -180 and 180")
        .max(180, "Longitude must be between -180 and 180"),
    ]),
  );

export const tripBookingFormSchema = z
  .object({
    bookingType: z.enum(TRIP_BOOKING_TYPE_VALUES, {
      message: "Select a booking type",
    }),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(160, "Title must be 160 characters or fewer"),
    providerName: optionalNullableText(160, "Provider name"),
    confirmationNumber: optionalNullableText(120, "Confirmation number"),
    bookingReference: optionalNullableText(120, "Booking reference"),
    status: optionalNullableText(80, "Status"),
    startDate: dateFieldSchema,
    startTime: timeFieldSchema,
    endDate: dateFieldSchema,
    endTime: timeFieldSchema,
    locationName: optionalNullableText(160, "Location name"),
    address: optionalNullableText(240, "Address"),
    geoapifyPlaceId: optionalNullableText(256, "Place id"),
    latitude: optionalLatitude,
    longitude: optionalLongitude,
    departureLocation: optionalNullableText(160, "Departure location"),
    arrivalLocation: optionalNullableText(160, "Arrival location"),
    carrierName: optionalNullableText(120, "Carrier name"),
    transportNumber: optionalNullableText(80, "Transport number"),
    terminal: optionalNullableText(80, "Terminal"),
    gate: optionalNullableText(40, "Gate"),
    checkInTime: timeFieldSchema,
    checkOutTime: timeFieldSchema,
    notes: optionalNullableText(2000, "Notes"),
  })
  .superRefine((values, ctx) => {
    if (values.startDate != null && values.endDate != null) {
      if (values.endDate < values.startDate) {
        ctx.addIssue({
          code: "custom",
          message: "End date must be on or after the start date",
          path: ["endDate"],
        });
      } else if (
        values.endDate === values.startDate &&
        values.startTime != null &&
        values.endTime != null
      ) {
        try {
          if (compareTimes(values.endTime, values.startTime) < 0) {
            ctx.addIssue({
              code: "custom",
              message: "End time must be on or after start time",
              path: ["endTime"],
            });
          }
        } catch {
          ctx.addIssue({
            code: "custom",
            message: "Use HH:mm format (e.g. 09:30)",
            path: ["endTime"],
          });
        }
      }
    }

    const hasLat = values.latitude != null;
    const hasLng = values.longitude != null;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude and longitude must both be set or both be empty",
        path: hasLat ? ["longitude"] : ["latitude"],
      });
    }

    if (!hasLat && !hasLng && values.geoapifyPlaceId != null) {
      ctx.addIssue({
        code: "custom",
        message: "Place metadata is incomplete",
        path: ["geoapifyPlaceId"],
      });
    }
  })
  .transform((values) => {
    const hasPair = values.latitude != null && values.longitude != null;
    return {
      ...values,
      geoapifyPlaceId: hasPair ? values.geoapifyPlaceId : null,
      latitude: hasPair ? values.latitude : null,
      longitude: hasPair ? values.longitude : null,
    };
  });

export const createBookingSchema = tripBookingFormSchema;
export const updateBookingSchema = tripBookingFormSchema;

export type TripBookingFormValues = z.output<typeof tripBookingFormSchema>;
export type TripBookingFormInput = z.input<typeof tripBookingFormSchema>;
