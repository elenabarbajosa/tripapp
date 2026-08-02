import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState/LoadingState";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { useAuth } from "@/features/auth/AuthProvider";
import { mapInvitationError } from "@/features/invitations/errors";
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useInvitationPreviewQuery,
} from "@/features/invitations/hooks";
import {
  clearPendingInviteToken,
  savePendingInviteToken,
} from "@/features/invitations/pendingInviteStorage";
import { roleLabel } from "@/features/trips/permissions";
import { formatInvitationExpiry } from "@/utils/date";
import { styles } from "./InviteAcceptScreen.styles";

function tokenFromParams(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) {
    return decodeURIComponent(raw[0] ?? "").trim();
  }
  if (typeof raw === "string") {
    return decodeURIComponent(raw).trim();
  }
  return "";
}

export function InviteAcceptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token: string | string[] }>();
  const token = tokenFromParams(params.token);
  const { isAuthenticated, isInitializing } = useAuth();

  const previewQuery = useInvitationPreviewQuery(token, Boolean(token));
  const acceptMutation = useAcceptInvitationMutation();
  const declineMutation = useDeclineInvitationMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const preview = previewQuery.data;

  useEffect(() => {
    if (!token || isAuthenticated) {
      return;
    }
    void savePendingInviteToken(token);
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!preview) {
      return;
    }
    if (preview.alreadyMember || !preview.isUsable) {
      void clearPendingInviteToken();
    }
  }, [preview]);

  const isBusy = acceptMutation.isPending || declineMutation.isPending;

  const onAccept = async () => {
    if (!token) {
      return;
    }
    setActionError(null);
    try {
      const tripId = await acceptMutation.mutateAsync(token);
      await clearPendingInviteToken();
      router.replace(`/trips/${tripId}/overview`);
    } catch (error) {
      setActionError(mapInvitationError(error));
    }
  };

  const onDecline = async () => {
    if (!token) {
      return;
    }
    setActionError(null);
    try {
      await declineMutation.mutateAsync(token);
      await clearPendingInviteToken();
      router.replace(isAuthenticated ? "/(main)/home" : "/(auth)/welcome");
    } catch (error) {
      setActionError(mapInvitationError(error));
    }
  };

  const onSignIn = () => {
    if (token) {
      void savePendingInviteToken(token);
    }
    router.push("/(auth)/welcome");
  };

  const unavailableMessage = (() => {
    if (!preview) {
      return null;
    }
    if (preview.alreadyMember) {
      return "You are already a member of this trip.";
    }
    if (preview.status === "revoked") {
      return "This invitation has been revoked.";
    }
    if (preview.status === "declined") {
      return "This invitation was declined.";
    }
    if (preview.status === "accepted") {
      return "This invitation has already been accepted.";
    }
    if (preview.isExpired || preview.status === "expired") {
      return "This invitation has expired.";
    }
    if (preview.requiresEmailMatch && preview.emailMatches === false) {
      return "This invitation was sent to a different email address. Sign in with the invited email to continue.";
    }
    if (!preview.isUsable) {
      return "This invitation is no longer available.";
    }
    return null;
  })();

  const canRespond =
    Boolean(preview) &&
    preview!.isUsable &&
    !preview!.alreadyMember &&
    !(preview!.requiresEmailMatch && preview!.emailMatches === false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader title="Trip invitation" subtitle="Review and respond" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!token ? (
          <ErrorState
            title="Invalid invite link"
            message="This invitation link is missing or incomplete."
            onRetry={() => router.replace("/(auth)/welcome")}
          />
        ) : null}

        {token && (isInitializing || previewQuery.isLoading) ? (
          <LoadingState label="Loading invitation…" />
        ) : null}

        {token && previewQuery.isError ? (
          <ErrorState
            title="Could not load invitation"
            message={mapInvitationError(previewQuery.error)}
            onRetry={() => {
              void previewQuery.refetch();
            }}
          />
        ) : null}

        {preview ? (
          <AppCard variant="elevated">
            <View style={styles.card}>
              <View style={styles.badges}>
                <StatusBadge label="Invitation" variant="invitation" />
                <StatusBadge label={roleLabel(preview.intendedRole)} variant="muted" />
              </View>
              <Text style={styles.tripName}>{preview.tripName}</Text>
              <Text style={styles.meta}>Invited by {preview.inviterDisplayName}</Text>
              {preview.destinationSummary ? (
                <Text style={styles.meta}>{preview.destinationSummary}</Text>
              ) : null}
              <Text style={styles.meta}>{formatInvitationExpiry(preview.expiresAt)}</Text>
            </View>
          </AppCard>
        ) : null}

        {unavailableMessage ? (
          <View style={styles.messageBlock}>
            <Text style={styles.message}>{unavailableMessage}</Text>
            {preview?.alreadyMember ? (
              <AppButton
                label="Open trip"
                onPress={() => router.replace(`/trips/${preview.tripId}/overview`)}
              />
            ) : (
              <AppButton
                label={isAuthenticated ? "Go home" : "Back to welcome"}
                variant="secondary"
                onPress={() =>
                  router.replace(isAuthenticated ? "/(main)/home" : "/(auth)/welcome")
                }
              />
            )}
          </View>
        ) : null}

        {preview && canRespond && !isAuthenticated ? (
          <View style={styles.messageBlock}>
            <Text style={styles.message}>
              Sign in to accept this invitation. We will bring you back here after you sign in.
            </Text>
            <AppButton label="Sign in to continue" onPress={onSignIn} />
          </View>
        ) : null}

        {preview && canRespond && isAuthenticated ? (
          <View style={styles.actions}>
            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
            <AppButton
              label="Accept invitation"
              loading={acceptMutation.isPending}
              disabled={isBusy}
              onPress={() => {
                void onAccept();
              }}
            />
            <AppButton
              label="Decline"
              variant="secondary"
              loading={declineMutation.isPending}
              disabled={isBusy}
              onPress={() => {
                void onDecline();
              }}
            />
          </View>
        ) : null}

        {actionError && !(preview && canRespond && isAuthenticated) ? (
          <Text style={styles.error}>{actionError}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
