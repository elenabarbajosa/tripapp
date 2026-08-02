import { z } from "zod";

const categories = [
  "clothes",
  "toiletries",
  "electronics",
  "documents",
  "medication",
  "travel",
  "other",
] as const;

export const packingItemFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(160, "Title must be 160 characters or fewer"),
    category: z.enum(categories, { message: "Select a category" }),
    scope: z.enum(["shared", "personal"], { message: "Select shared or personal" }),
    assignedTo: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) => {
        if (value == null || value.trim() === "") {
          return null;
        }
        return value.trim();
      })
      .pipe(z.union([z.null(), z.string().uuid({ message: "Select a traveller" })])),
    quantity: z.coerce
      .number({ message: "Enter a quantity" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(99, "Quantity must be 99 or fewer"),
    notes: z
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
          z.string().max(1000, "Notes must be 1000 characters or fewer"),
        ]),
      ),
  })
  .superRefine((values, ctx) => {
    if (values.scope === "personal" && values.assignedTo == null) {
      ctx.addIssue({
        code: "custom",
        message: "Personal items require an assignee",
        path: ["assignedTo"],
      });
    }
  });

export type PackingItemFormValues = z.output<typeof packingItemFormSchema>;
export type PackingItemFormInput = z.input<typeof packingItemFormSchema>;
