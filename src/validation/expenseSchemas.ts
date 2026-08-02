import { z } from "zod";

import { parseDisplayDateToISO } from "@/utils/dateOnly";
import { currencyFractionDigits, isValidCurrencyCode, splitEqualMinor, toMinorUnits } from "@/utils/money";

const TRIP_EXPENSE_CATEGORY_VALUES = [
  "accommodation",
  "transport",
  "food",
  "activities",
  "shopping",
  "other",
] as const;

const TRIP_EXPENSE_SPLIT_METHOD_VALUES = ["equal", "exact", "percentage"] as const;

const AMOUNT_TEXT_PATTERN = /^\d+(\.\d{1,4})?$/;

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

/** Parses a decimal major-unit text field into minor units, allowing zero (unlike toMinorUnits). */
function parseMajorTextToMinor(text: string, currencyCode: string): number {
  const digits = currencyFractionDigits(currencyCode);
  const factor = 10 ** digits;
  return Math.round(Number(text) * factor);
}

export interface TripExpenseFormParticipant {
  userId: string;
  shareAmountMinor: number | null;
  sharePercentage: number | null;
}

const participantSchema = z.object({
  userId: z.string().uuid({ message: "Select a participant" }),
  shareAmount: z.string().optional(),
  sharePercentage: z.string().optional(),
});

export const tripExpenseFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(160, "Title must be 160 characters or fewer"),
    category: z.enum(TRIP_EXPENSE_CATEGORY_VALUES, { message: "Select a category" }),
    amount: z.string().trim().min(1, "Amount is required"),
    currencyCode: z.string().trim().min(1, "Currency is required"),
    expenseDate: z.string().trim().min(1, "Date is required"),
    paidBy: z.string().uuid({ message: "Select who paid" }),
    splitMethod: z.enum(TRIP_EXPENSE_SPLIT_METHOD_VALUES, {
      message: "Select a split method",
    }),
    participants: z
      .array(participantSchema)
      .min(1, "At least one participant is required"),
    notes: optionalNullableText(2000, "Notes"),
  })
  .superRefine((values, ctx) => {
    const currency = values.currencyCode.trim().toUpperCase();
    if (!isValidCurrencyCode(currency)) {
      ctx.addIssue({
        code: "custom",
        message: "Use a 3-letter currency code",
        path: ["currencyCode"],
      });
    }

    let amountMajor: number | null = null;
    const amountTrimmed = values.amount.trim();
    if (!AMOUNT_TEXT_PATTERN.test(amountTrimmed)) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount", path: ["amount"] });
    } else {
      amountMajor = Number(amountTrimmed);
      if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Amount must be greater than zero",
          path: ["amount"],
        });
        amountMajor = null;
      }
    }

    try {
      const iso = parseDisplayDateToISO(values.expenseDate);
      if (!iso) {
        ctx.addIssue({ code: "custom", message: "Date is required", path: ["expenseDate"] });
      }
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid date",
        path: ["expenseDate"],
      });
    }

    const seen = new Set<string>();
    values.participants.forEach((participant, index) => {
      if (seen.has(participant.userId)) {
        ctx.addIssue({
          code: "custom",
          message: "Each participant can only appear once",
          path: ["participants", index, "userId"],
        });
      }
      seen.add(participant.userId);
    });

    if (amountMajor != null && isValidCurrencyCode(currency)) {
      const amountMinor = toMinorUnits(amountMajor, currency);

      if (values.splitMethod === "exact") {
        let sum = 0;
        let sawInvalid = false;
        values.participants.forEach((participant, index) => {
          const raw = (participant.shareAmount ?? "").trim();
          if (!AMOUNT_TEXT_PATTERN.test(raw)) {
            ctx.addIssue({
              code: "custom",
              message: "Enter a valid amount",
              path: ["participants", index, "shareAmount"],
            });
            sawInvalid = true;
            return;
          }
          sum += parseMajorTextToMinor(raw, currency);
        });
        if (!sawInvalid && sum !== amountMinor) {
          ctx.addIssue({
            code: "custom",
            message: "Share amounts must add up to the total",
            path: ["participants"],
          });
        }
      } else if (values.splitMethod === "percentage") {
        let sum = 0;
        let sawInvalid = false;
        values.participants.forEach((participant, index) => {
          const raw = (participant.sharePercentage ?? "").trim();
          const value = Number(raw);
          if (raw === "" || !Number.isFinite(value) || value < 0 || value > 100) {
            ctx.addIssue({
              code: "custom",
              message: "Enter a percentage between 0 and 100",
              path: ["participants", index, "sharePercentage"],
            });
            sawInvalid = true;
            return;
          }
          sum += value;
        });
        if (!sawInvalid && Math.abs(sum - 100) > 0.01) {
          ctx.addIssue({
            code: "custom",
            message: "Percentages must total 100",
            path: ["participants"],
          });
        }
      }
    }
  })
  .transform((values) => {
    const currency = values.currencyCode.trim().toUpperCase();
    const amountMinor = toMinorUnits(Number(values.amount.trim()), currency);
    const expenseDate = parseDisplayDateToISO(values.expenseDate.trim()) as string;

    let participants: TripExpenseFormParticipant[];
    if (values.splitMethod === "equal") {
      const shares = splitEqualMinor(amountMinor, values.participants.length);
      participants = values.participants.map((participant, index) => ({
        userId: participant.userId,
        shareAmountMinor: shares[index] ?? 0,
        sharePercentage: null,
      }));
    } else if (values.splitMethod === "exact") {
      participants = values.participants.map((participant) => ({
        userId: participant.userId,
        shareAmountMinor: parseMajorTextToMinor(
          (participant.shareAmount ?? "0").trim(),
          currency,
        ),
        sharePercentage: null,
      }));
    } else {
      participants = values.participants.map((participant) => ({
        userId: participant.userId,
        shareAmountMinor: null,
        sharePercentage: Number((participant.sharePercentage ?? "0").trim()),
      }));
    }

    return {
      title: values.title,
      category: values.category,
      amountMinor,
      currencyCode: currency,
      expenseDate,
      paidBy: values.paidBy,
      splitMethod: values.splitMethod,
      participants,
      notes: values.notes,
    };
  });

export const createExpenseSchema = tripExpenseFormSchema;
export const updateExpenseSchema = tripExpenseFormSchema;

export type TripExpenseFormValues = z.output<typeof tripExpenseFormSchema>;
export type TripExpenseFormInput = z.input<typeof tripExpenseFormSchema>;
