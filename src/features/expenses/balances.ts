import type { TripExpense, TripExpenseSettlement } from "@/types/models";

/**
 * Net balance for one user within one currency.
 *
 * Formula: net = paid - owedShare + settlementsSent - settlementsReceived
 * Positive => this user is owed money overall.
 * Negative => this user owes money overall.
 * Zero => settled up.
 *
 * Currencies are never converted or mixed: a user with expenses in two
 * currencies gets two separate TripBalance entries.
 */
export interface TripBalance {
  userId: string;
  currencyCode: string;
  paidMinor: number;
  owedMinor: number;
  settlementsSentMinor: number;
  settlementsReceivedMinor: number;
  netMinor: number;
}

interface BalanceAccumulator {
  paidMinor: number;
  owedMinor: number;
  settlementsSentMinor: number;
  settlementsReceivedMinor: number;
}

const KEY_SEPARATOR = "::";

function balanceKey(userId: string, currencyCode: string): string {
  return `${userId}${KEY_SEPARATOR}${currencyCode}`;
}

function emptyAccumulator(): BalanceAccumulator {
  return {
    paidMinor: 0,
    owedMinor: 0,
    settlementsSentMinor: 0,
    settlementsReceivedMinor: 0,
  };
}

/**
 * Computes per-user, per-currency balances from trip expenses (with splits)
 * and settlements. Never converts between currencies.
 */
export function calculateTripBalances(
  expenses: TripExpense[],
  settlements: TripExpenseSettlement[],
): TripBalance[] {
  const accumulators = new Map<string, BalanceAccumulator>();

  function ensure(userId: string, currencyCode: string): BalanceAccumulator {
    const key = balanceKey(userId, currencyCode);
    let entry = accumulators.get(key);
    if (!entry) {
      entry = emptyAccumulator();
      accumulators.set(key, entry);
    }
    return entry;
  }

  for (const expense of expenses) {
    const payerEntry = ensure(expense.paidBy, expense.currencyCode);
    payerEntry.paidMinor += expense.amountMinor;

    for (const split of expense.splits) {
      const participantEntry = ensure(split.userId, expense.currencyCode);
      participantEntry.owedMinor += split.shareAmountMinor;
    }
  }

  for (const settlement of settlements) {
    const payerEntry = ensure(settlement.payerId, settlement.currencyCode);
    payerEntry.settlementsSentMinor += settlement.amountMinor;

    const payeeEntry = ensure(settlement.payeeId, settlement.currencyCode);
    payeeEntry.settlementsReceivedMinor += settlement.amountMinor;
  }

  const balances: TripBalance[] = [];
  for (const [key, entry] of accumulators.entries()) {
    const separatorIndex = key.lastIndexOf(KEY_SEPARATOR);
    const userId = key.slice(0, separatorIndex);
    const currencyCode = key.slice(separatorIndex + KEY_SEPARATOR.length);
    const netMinor =
      entry.paidMinor -
      entry.owedMinor +
      entry.settlementsSentMinor -
      entry.settlementsReceivedMinor;
    balances.push({ userId, currencyCode, ...entry, netMinor });
  }

  return balances.sort((a, b) => {
    if (a.currencyCode !== b.currencyCode) {
      return a.currencyCode < b.currencyCode ? -1 : 1;
    }
    if (a.netMinor !== b.netMinor) {
      return b.netMinor - a.netMinor;
    }
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });
}

/** True when a balance is close enough to zero to be considered settled. */
export function isBalanceSettled(balance: TripBalance): boolean {
  return balance.netMinor === 0;
}

/** Balances for a single user across every currency they participated in. */
export function balancesForUser(
  balances: TripBalance[],
  userId: string,
): TripBalance[] {
  return balances.filter((balance) => balance.userId === userId);
}
