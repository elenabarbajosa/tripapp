import { z } from "zod";

import { compareTimes, isValidTimeHHmm } from "@/utils/time";

const TRIP_ACTIVITY_CATEGORY_VALUES = [
  "activity",
  "sightseeing",
  "food",
  "nightlife",
  "shopping",
  "transport",
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

const destinationIdSchema = z
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
      z.string().uuid({ message: "Select a valid destination" }),
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

export const tripActivityFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(120, "Title must be 120 characters or fewer"),
    category: z.enum(TRIP_ACTIVITY_CATEGORY_VALUES, {
      message: "Select a category",
    }),
    tripDayId: z.string().uuid({ message: "Select a trip day" }),
    destinationId: destinationIdSchema,
    isAllDay: z.boolean(),
    startTime: timeFieldSchema,
    endTime: timeFieldSchema,
    locationName: optionalNullableText(160, "Location name"),
    address: optionalNullableText(240, "Address"),
    geoapifyPlaceId: optionalNullableText(256, "Place id"),
    latitude: optionalLatitude,
    longitude: optionalLongitude,
    description: optionalNullableText(2000, "Description"),
    notes: optionalNullableText(2000, "Notes"),
  })
  .superRefine((values, ctx) => {
    if (values.isAllDay) {
      // continue to coordinate checks
    } else if (values.startTime != null && values.endTime != null) {
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
      startTime: values.isAllDay ? null : values.startTime,
      endTime: values.isAllDay ? null : values.endTime,
      geoapifyPlaceId: hasPair ? values.geoapifyPlaceId : null,
      latitude: hasPair ? values.latitude : null,
      longitude: hasPair ? values.longitude : null,
    };
  });

export const createActivitySchema = tripActivityFormSchema;
export const updateActivitySchema = tripActivityFormSchema;

export type TripActivityFormValues = z.output<typeof tripActivityFormSchema>;
export type TripActivityFormInput = z.input<typeof tripActivityFormSchema>;
