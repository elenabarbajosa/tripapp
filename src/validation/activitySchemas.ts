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
    description: optionalNullableText(2000, "Description"),
    notes: optionalNullableText(2000, "Notes"),
  })
  .superRefine((values, ctx) => {
    if (values.isAllDay) {
      return;
    }
    if (values.startTime != null && values.endTime != null) {
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
  })
  .transform((values) => ({
    ...values,
    startTime: values.isAllDay ? null : values.startTime,
    endTime: values.isAllDay ? null : values.endTime,
  }));

export const createActivitySchema = tripActivityFormSchema;
export const updateActivitySchema = tripActivityFormSchema;

export type TripActivityFormValues = z.output<typeof tripActivityFormSchema>;
export type TripActivityFormInput = z.input<typeof tripActivityFormSchema>;
