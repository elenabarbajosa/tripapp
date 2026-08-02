import { requireSupabaseClient } from "@/services/supabase";
import type { TripExpenseCategory, TripExpenseSplitMethod } from "@/types/database";
import type { TripExpense, TripExpenseSettlement } from "@/types/models";
import { isValidUuid } from "@/utils/routeParams";
import { mapExpenseError, getExpenseErrorDebug } from "./errors";
import {
  mapExpenseRow,
  mapSettlementRow,
  sortExpenses,
  sortSettlements,
  type TripExpenseRowWithSplits,
} from "./mappers";

const EXPENSE_SELECT = `
  id,
  trip_id,
  created_by,
  paid_by,
  title,
  category,
  amount_minor,
  currency_code,
  expense_date,
  split_method,
  notes,
  created_at,
  updated_at,
  trip_expense_splits (
    expense_id,
    user_id,
    share_amount_minor,
    share_percentage,
    created_at
  )
`;

const SETTLEMENT_SELECT = `
  id,
  trip_id,
  created_by,
  payer_id,
  payee_id,
  amount_minor,
  currency_code,
  settlement_date,
  notes,
  created_at,
  updated_at
`;

export interface ExpenseSplitInput {
  userId: string;
  shareAmountMinor?: number | null;
  sharePercentage?: number | null;
}

export interface CreateTripExpenseInput {
  tripId: string;
  title: string;
  category: TripExpenseCategory;
  amountMinor: number;
  currencyCode: string;
  expenseDate: string;
  paidBy: string;
  splitMethod: TripExpenseSplitMethod;
  participants: ExpenseSplitInput[];
  notes?: string | null;
}

export interface UpdateTripExpenseInput extends CreateTripExpenseInput {
  expenseId: string;
}

export interface DeleteTripExpenseInput {
  tripId: string;
  expenseId: string;
}

export interface RecordTripSettlementInput {
  tripId: string;
  payerId: string;
  payeeId: string;
  amountMinor: number;
  currencyCode: string;
  settlementDate: string;
  notes?: string | null;
}

export interface DeleteTripSettlementInput {
  tripId: string;
  settlementId: string;
}

function assertUuid(value: string | undefined | null, label: string): string {
  if (!isValidUuid(value)) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function assertParticipants(participants: ExpenseSplitInput[]): ExpenseSplitInput[] {
  if (!Array.isArray(participants) || participants.length < 1) {
    throw new Error("At least one participant is required.");
  }
  for (const participant of participants) {
    assertUuid(participant.userId, "Participant id");
  }
  return participants;
}

function logExpenseError(context: string, error: unknown): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[expenses:${context}]`, getExpenseErrorDebug(error));
}

export async function getTripExpenses(tripId: string): Promise<TripExpense[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_expenses")
    .select(EXPENSE_SELECT)
    .eq("trip_id", resolvedTripId);

  if (error) {
    logExpenseError("getTripExpenses", error);
    throw mapExpenseError(error);
  }

  return sortExpenses(
    ((data ?? []) as TripExpenseRowWithSplits[]).map((row) => mapExpenseRow(row)),
  );
}

export async function getTripExpenseById(
  tripId: string,
  expenseId: string,
): Promise<TripExpense | null> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const resolvedExpenseId = assertUuid(expenseId, "Expense id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_expenses")
    .select(EXPENSE_SELECT)
    .eq("trip_id", resolvedTripId)
    .eq("id", resolvedExpenseId)
    .maybeSingle();

  if (error) {
    logExpenseError("getTripExpenseById", error);
    throw mapExpenseError(error);
  }

  if (!data) {
    return null;
  }

  return mapExpenseRow(data as TripExpenseRowWithSplits);
}

export async function createTripExpense(
  input: CreateTripExpenseInput,
): Promise<TripExpense> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const paidBy = assertUuid(input.paidBy, "Payer");
  const participants = assertParticipants(input.participants);

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("create_trip_expense", {
    p_trip_id: tripId,
    p_title: input.title.trim(),
    p_category: input.category,
    p_amount_minor: input.amountMinor,
    p_currency_code: input.currencyCode.trim().toUpperCase(),
    p_expense_date: input.expenseDate,
    p_paid_by: paidBy,
    p_split_method: input.splitMethod,
    p_participant_ids: participants.map((participant) => participant.userId.trim()),
    p_share_amounts_minor:
      input.splitMethod === "exact"
        ? participants.map((participant) => participant.shareAmountMinor ?? 0)
        : null,
    p_share_percentages:
      input.splitMethod === "percentage"
        ? participants.map((participant) => participant.sharePercentage ?? 0)
        : null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    logExpenseError("createTripExpense", error);
    throw mapExpenseError(error);
  }

  const expenseId = data as string;
  const created = await getTripExpenseById(tripId, expenseId);
  if (!created) {
    throw new Error("Expense was created but could not be loaded.");
  }
  return created;
}

export async function updateTripExpense(
  input: UpdateTripExpenseInput,
): Promise<TripExpense> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const expenseId = assertUuid(input.expenseId, "Expense id");
  const paidBy = assertUuid(input.paidBy, "Payer");
  const participants = assertParticipants(input.participants);

  const client = requireSupabaseClient();
  const { error } = await client.rpc("update_trip_expense", {
    p_expense_id: expenseId,
    p_title: input.title.trim(),
    p_category: input.category,
    p_amount_minor: input.amountMinor,
    p_currency_code: input.currencyCode.trim().toUpperCase(),
    p_expense_date: input.expenseDate,
    p_paid_by: paidBy,
    p_split_method: input.splitMethod,
    p_participant_ids: participants.map((participant) => participant.userId.trim()),
    p_share_amounts_minor:
      input.splitMethod === "exact"
        ? participants.map((participant) => participant.shareAmountMinor ?? 0)
        : null,
    p_share_percentages:
      input.splitMethod === "percentage"
        ? participants.map((participant) => participant.sharePercentage ?? 0)
        : null,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    logExpenseError("updateTripExpense", error);
    throw mapExpenseError(error);
  }

  const updated = await getTripExpenseById(tripId, expenseId);
  if (!updated) {
    throw new Error("Expense was updated but could not be loaded.");
  }
  return updated;
}

export async function deleteTripExpense(input: DeleteTripExpenseInput): Promise<void> {
  assertUuid(input.tripId, "Trip id");
  const expenseId = assertUuid(input.expenseId, "Expense id");
  const client = requireSupabaseClient();

  const { error } = await client.rpc("delete_trip_expense", {
    p_expense_id: expenseId,
  });

  if (error) {
    logExpenseError("deleteTripExpense", error);
    throw mapExpenseError(error);
  }
}

export async function getTripSettlements(
  tripId: string,
): Promise<TripExpenseSettlement[]> {
  const resolvedTripId = assertUuid(tripId, "Trip id");
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_expense_settlements")
    .select(SETTLEMENT_SELECT)
    .eq("trip_id", resolvedTripId);

  if (error) {
    logExpenseError("getTripSettlements", error);
    throw mapExpenseError(error);
  }

  return sortSettlements((data ?? []).map((row) => mapSettlementRow(row)));
}

async function getTripSettlementById(
  tripId: string,
  settlementId: string,
): Promise<TripExpenseSettlement | null> {
  const client = requireSupabaseClient();

  const { data, error } = await client
    .from("trip_expense_settlements")
    .select(SETTLEMENT_SELECT)
    .eq("trip_id", tripId)
    .eq("id", settlementId)
    .maybeSingle();

  if (error) {
    logExpenseError("getTripSettlementById", error);
    throw mapExpenseError(error);
  }

  if (!data) {
    return null;
  }

  return mapSettlementRow(data);
}

export async function recordTripSettlement(
  input: RecordTripSettlementInput,
): Promise<TripExpenseSettlement> {
  const tripId = assertUuid(input.tripId, "Trip id");
  const payerId = assertUuid(input.payerId, "Payer");
  const payeeId = assertUuid(input.payeeId, "Payee");

  const client = requireSupabaseClient();
  const { data, error } = await client.rpc("record_trip_settlement", {
    p_trip_id: tripId,
    p_payer_id: payerId,
    p_payee_id: payeeId,
    p_amount_minor: input.amountMinor,
    p_currency_code: input.currencyCode.trim().toUpperCase(),
    p_settlement_date: input.settlementDate,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    logExpenseError("recordTripSettlement", error);
    throw mapExpenseError(error);
  }

  const settlementId = data as string;
  const created = await getTripSettlementById(tripId, settlementId);
  if (!created) {
    throw new Error("Settlement was recorded but could not be loaded.");
  }
  return created;
}

export async function deleteTripSettlement(
  input: DeleteTripSettlementInput,
): Promise<void> {
  assertUuid(input.tripId, "Trip id");
  const settlementId = assertUuid(input.settlementId, "Settlement id");
  const client = requireSupabaseClient();

  const { error } = await client.rpc("delete_trip_settlement", {
    p_settlement_id: settlementId,
  });

  if (error) {
    logExpenseError("deleteTripSettlement", error);
    throw mapExpenseError(error);
  }
}
