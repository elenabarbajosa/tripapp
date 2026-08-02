import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";
import { calculateTripBalances, type TripBalance } from "@/features/expenses/balances";
import { getExpenseErrorDebug } from "@/features/expenses/errors";
import { useTripExpensesQuery, useTripSettlementsQuery } from "@/features/expenses/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canManageExpenses, canRecordSettlement, canViewExpenses } from "@/features/trips/permissions";
import type { TripExpense, TripSummary } from "@/types/models";
import { formatDisplayDate } from "@/utils/date";
import { getTripExpenseCategoryColor, getTripExpenseCategoryLabel } from "@/utils/expenseCategory";
import { formatMinorCurrency } from "@/utils/money";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./ExpensesScreen.styles";

function memberDisplayName(trip: TripSummary | null, userId: string): string {
  const member = trip?.members.find((candidate) => candidate.profile.id === userId);
  return member?.profile.displayName ?? "Member";
}

function balanceStyle(balance: TripBalance) {
  if (balance.netMinor > 0) {
    return styles.balanceAmountPositive;
  }
  if (balance.netMinor < 0) {
    return styles.balanceAmountNegative;
  }
  return styles.balanceAmountSettled;
}

function balanceLabel(balance: TripBalance): string {
  const amount = formatMinorCurrency(Math.abs(balance.netMinor), balance.currencyCode);
  if (balance.netMinor > 0) {
    return `is owed ${amount}`;
  }
  if (balance.netMinor < 0) {
    return `owes ${amount}`;
  }
  return "settled up";
}

export function ExpensesScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const tripId = resolveRouteParam(params.tripId);
  const hasValidTripId = isValidUuid(tripId);

  const { isAuthenticated, isInitializing, user } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady && isAuthenticated && !isPreviewActive && hasValidTripId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const expensesQuery = useTripExpensesQuery(tripId, shouldLoad && Boolean(tripQuery.data));
  const settlementsQuery = useTripSettlementsQuery(
    tripId,
    shouldLoad && Boolean(tripQuery.data),
  );

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const settlements = useMemo(() => settlementsQuery.data ?? [], [settlementsQuery.data]);

  const canView = !isPreviewActive && canViewExpenses(role);
  const canAdd = !isPreviewActive && canManageExpenses(role);
  const canSettle = !isPreviewActive && canRecordSettlement(role);

  const balances = useMemo(
    () => calculateTripBalances(expenses, settlements),
    [expenses, settlements],
  );

  const onAddExpense = () => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({ pathname: "/trips/[tripId]/expenses/new", params: { tripId } });
  };

  const onRecordSettlement = () => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/expenses/settlements/new",
      params: { tripId },
    });
  };

  const onOpenExpense = (expense: TripExpense) => {
    if (!hasValidTripId || !tripId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/expenses/[expenseId]",
      params: { tripId, expenseId: expense.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isPreviewActive && !hasValidTripId ? (
          <EmptyState
            title="Trip not found"
            body="This expenses link is missing a valid trip id. Go back and open the trip again."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Expenses preview"
            body="Sign in and open a live trip to track shared expenses and balances."
          />
        ) : null}

        {shouldLoad && (tripQuery.isLoading || expensesQuery.isLoading || settlementsQuery.isLoading) ? (
          <LoadingState label="Loading expenses…" />
        ) : null}

        {shouldLoad && tripQuery.isError ? (
          <ErrorState
            title="Could not load trip"
            message={
              tripQuery.error instanceof Error ? tripQuery.error.message : "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && !tripQuery.isError && (expensesQuery.isError || settlementsQuery.isError) ? (
          <ErrorState
            title="Could not load expenses"
            message={(() => {
              const source = expensesQuery.isError ? expensesQuery.error : settlementsQuery.error;
              const readable = source instanceof Error ? source.message : "Try again in a moment.";
              if (!__DEV__) {
                return readable;
              }
              const debug = getExpenseErrorDebug(source);
              if (!debug) {
                return readable;
              }
              const parts = [
                readable,
                debug.code ? `code=${debug.code}` : null,
                debug.details ? `details=${debug.details}` : null,
                debug.hint ? `hint=${debug.hint}` : null,
              ].filter(Boolean);
              return parts.join("\n");
            })()}
            onRetry={() => {
              void expensesQuery.refetch();
              void settlementsQuery.refetch();
            }}
          />
        ) : null}

        {shouldLoad && trip && canView && !expensesQuery.isError && !settlementsQuery.isError ? (
          <>
            {balances.length > 0 ? (
              <View style={styles.balancesCard}>
                <Text style={styles.balancesTitle}>Balances</Text>
                {balances.map((balance) => (
                  <View key={`${balance.userId}-${balance.currencyCode}`} style={styles.balanceRow}>
                    <Text style={styles.balanceName}>{memberDisplayName(trip, balance.userId)}</Text>
                    <Text style={balanceStyle(balance)}>{balanceLabel(balance)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {canSettle ? (
              <View style={styles.actionsRow}>
                <View style={styles.actionsRowItem}>
                  <AppButton
                    label="Record settlement"
                    variant="secondary"
                    onPress={onRecordSettlement}
                  />
                </View>
              </View>
            ) : null}

            {expenses.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                body={
                  canAdd
                    ? "Add shared expenses to track who paid and who owes what."
                    : "Owners and editors can add expenses."
                }
              />
            ) : (
              <View style={styles.list}>
                <Text style={styles.sectionTitle}>Expenses</Text>
                {expenses.map((expense) => {
                  const categoryColor = getTripExpenseCategoryColor(expense.category);
                  const categoryLabel = getTripExpenseCategoryLabel(expense.category);
                  return (
                    <Pressable
                      key={expense.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${expense.title}, ${formatMinorCurrency(expense.amountMinor, expense.currencyCode)}`}
                      onPress={() => onOpenExpense(expense)}
                      style={styles.card}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{expense.title}</Text>
                        <Text style={styles.cardAmount}>
                          {formatMinorCurrency(expense.amountMinor, expense.currencyCode)}
                        </Text>
                      </View>
                      <View
                        style={[styles.categoryBadge, { backgroundColor: `${categoryColor}1A` }]}
                        accessibilityLabel={`Category ${categoryLabel}`}
                      >
                        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                        <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                          {categoryLabel}
                        </Text>
                      </View>
                      <Text style={styles.cardMeta}>
                        {formatDisplayDate(expense.expenseDate)} · Paid by{" "}
                        {memberDisplayName(trip, expense.paidBy)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.fabSpacer} />
          </>
        ) : null}
      </ScrollView>

      {canAdd ? (
        <View style={styles.fabContainer}>
          <AppButton label="Add expense" onPress={onAddExpense} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
