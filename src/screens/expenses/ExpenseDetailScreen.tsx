import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog/ConfirmationDialog";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { useDeleteTripExpenseMutation, useTripExpenseQuery } from "@/features/expenses/hooks";
import { usePreview } from "@/features/preview/PreviewProvider";
import { useTripQuery } from "@/features/trips/hooks";
import { currentUserRole } from "@/features/trips/mappers";
import { canManageExpenses } from "@/features/trips/permissions";
import type { TripSummary } from "@/types/models";
import { formatDisplayDate } from "@/utils/date";
import { getTripExpenseCategoryColor, getTripExpenseCategoryLabel, getSplitMethodLabel } from "@/utils/expenseCategory";
import { formatMinorCurrency } from "@/utils/money";
import { isValidUuid, resolveRouteParam } from "@/utils/routeParams";
import { styles } from "./ExpenseDetailScreen.styles";

function memberDisplayName(trip: TripSummary | null, userId: string): string {
  const member = trip?.members.find((candidate) => candidate.profile.id === userId);
  return member?.profile.displayName ?? "Member";
}

export function ExpenseDetailScreen() {
  const router = useRouter();
  const globalParams = useGlobalSearchParams<{ tripId?: string | string[] }>();
  const localParams = useLocalSearchParams<{
    tripId?: string | string[];
    expenseId?: string | string[];
  }>();

  const tripId = resolveRouteParam(localParams.tripId ?? globalParams.tripId);
  const expenseId = resolveRouteParam(localParams.expenseId);
  const hasValidTripId = isValidUuid(tripId);
  const hasValidExpenseId = isValidUuid(expenseId);

  const { user, isAuthenticated, isInitializing } = useAuth();
  const { isPreviewActive } = usePreview();

  const authIsReady = !isInitializing;
  const shouldLoad =
    authIsReady &&
    isAuthenticated &&
    !isPreviewActive &&
    hasValidTripId &&
    hasValidExpenseId;

  const tripQuery = useTripQuery(tripId, shouldLoad);
  const expenseQuery = useTripExpenseQuery(
    tripId,
    expenseId,
    shouldLoad && Boolean(tripQuery.data),
  );

  const trip = tripQuery.data ?? null;
  const role = trip ? currentUserRole(trip, user?.id) : null;
  const expense = expenseQuery.data ?? null;

  const canManage = !isPreviewActive && canManageExpenses(role);

  const [pendingDelete, setPendingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const deleteMutation = useDeleteTripExpenseMutation();

  const isLoading = shouldLoad && (tripQuery.isLoading || expenseQuery.isLoading);
  const loadError = shouldLoad && (tripQuery.isError || expenseQuery.isError);
  const showInvalidParams = !isPreviewActive && (!hasValidTripId || !hasValidExpenseId);
  const showMissing =
    shouldLoad && trip && !loadError && !isLoading && expense == null;

  const onEdit = () => {
    if (!hasValidTripId || !hasValidExpenseId || !tripId || !expenseId) {
      return;
    }
    router.push({
      pathname: "/trips/[tripId]/expenses/[expenseId]/edit",
      params: { tripId, expenseId },
    });
  };

  const onConfirmDelete = async () => {
    if (!hasValidTripId || !hasValidExpenseId || !tripId || !expenseId) {
      setPendingDelete(false);
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({ tripId, expenseId });
      setPendingDelete(false);
      router.back();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete expense.");
      setPendingDelete(false);
    }
  };

  const categoryColor = expense ? getTripExpenseCategoryColor(expense.category) : null;
  const categoryLabel = expense ? getTripExpenseCategoryLabel(expense.category) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Expense"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showInvalidParams ? (
          <EmptyState
            title="Expense not found"
            body="This expense link is missing a valid trip or expense id."
          />
        ) : null}

        {isPreviewActive ? (
          <EmptyState
            title="Preview mode"
            body="Sign in to a live trip to view expense details."
          />
        ) : null}

        {isLoading ? <LoadingState label="Loading expense…" /> : null}

        {loadError ? (
          <ErrorState
            title="Could not load expense"
            message={
              (tripQuery.error instanceof Error && tripQuery.error.message) ||
              (expenseQuery.error instanceof Error && expenseQuery.error.message) ||
              "Try again in a moment."
            }
            onRetry={() => {
              void tripQuery.refetch();
              void expenseQuery.refetch();
            }}
          />
        ) : null}

        {showMissing ? (
          <EmptyState title="Expense not found" body="This expense may have been deleted." />
        ) : null}

        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

        {shouldLoad && expense && categoryColor && categoryLabel ? (
          <View style={styles.card}>
            <View
              style={[styles.categoryBadge, { backgroundColor: `${categoryColor}1A` }]}
              accessibilityLabel={`Category ${categoryLabel}`}
            >
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.categoryLabel, { color: categoryColor }]}>{categoryLabel}</Text>
            </View>

            <Text style={styles.title}>{expense.title}</Text>
            <Text style={styles.amount}>
              {formatMinorCurrency(expense.amountMinor, expense.currencyCode)}
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date</Text>
              <Text style={styles.value}>{formatDisplayDate(expense.expenseDate)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paid by</Text>
              <Text style={styles.value}>{memberDisplayName(trip, expense.paidBy)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Split ({getSplitMethodLabel(expense.splitMethod)})</Text>
              {expense.splits.map((split) => (
                <View key={split.userId} style={styles.splitRow}>
                  <Text style={styles.splitName}>{memberDisplayName(trip, split.userId)}</Text>
                  <Text style={styles.splitAmount}>
                    {formatMinorCurrency(split.shareAmountMinor, expense.currencyCode)}
                    {split.sharePercentage != null ? ` (${split.sharePercentage}%)` : ""}
                  </Text>
                </View>
              ))}
            </View>

            {expense.notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notes}>{expense.notes}</Text>
              </View>
            ) : null}

            {canManage ? (
              <View style={styles.actions}>
                <AppButton label="Edit expense" onPress={onEdit} />
                <AppButton
                  label="Delete expense"
                  variant="destructive"
                  onPress={() => setPendingDelete(true)}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={pendingDelete}
        title="Delete expense?"
        message={
          expense ? `Remove “${expense.title}” from this trip? This cannot be undone.` : ""
        }
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={() => {
          void onConfirmDelete();
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setPendingDelete(false);
          }
        }}
      />
    </SafeAreaView>
  );
}
