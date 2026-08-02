import { z } from "zod";

import { parseDisplayDateToISO } from "@/utils/dateOnly";
import { isValidCurrencyCode, toMinorUnits } from "@/utils/money";

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

export const tripSettlementFormSchema = z
  .object({
    payerId: z.string().uuid({ message: "Select who paid" }),
    payeeId: z.string().uuid({ message: "Select who received payment" }),
    amount: z.string().trim().min(1, "Amount is required"),
    currencyCode: z.string().trim().min(1, "Currency is required"),
    settlementDate: z.string().trim().min(1, "Date is required"),
    notes: optionalNullableText(2000, "Notes"),
  })
  .superRefine((values, ctx) => {
    if (values.payerId === values.payeeId) {
      ctx.addIssue({
        code: "custom",
        message: "Payer and payee must be different",
        path: ["payeeId"],
      });
    }

    const currency = values.currencyCode.trim().toUpperCase();
    if (!isValidCurrencyCode(currency)) {
      ctx.addIssue({
        code: "custom",
        message: "Use a 3-letter currency code",
        path: ["currencyCode"],
      });
    }

    const amountTrimmed = values.amount.trim();
    if (!AMOUNT_TEXT_PATTERN.test(amountTrimmed) || Number(amountTrimmed) <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Amount must be greater than zero",
        path: ["amount"],
      });
    }

    try {
      const iso = parseDisplayDateToISO(values.settlementDate);
      if (!iso) {
        ctx.addIssue({
          code: "custom",
          message: "Date is required",
          path: ["settlementDate"],
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid date",
        path: ["settlementDate"],
      });
    }
  })
  .transform((values) => {
    const currency = values.currencyCode.trim().toUpperCase();
    return {
      payerId: values.payerId,
      payeeId: values.payeeId,
      amountMinor: toMinorUnits(Number(values.amount.trim()), currency),
      currencyCode: currency,
      settlementDate: parseDisplayDateToISO(values.settlementDate.trim()) as string,
      notes: values.notes,
    };
  });

export const recordSettlementSchema = tripSettlementFormSchema;

export type TripSettlementFormValues = z.output<typeof tripSettlementFormSchema>;
export type TripSettlementFormInput = z.input<typeof tripSettlementFormSchema>;
