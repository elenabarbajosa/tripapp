import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppCard } from "@/components/ui/AppCard/AppCard";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import type { InviteRole } from "@/features/invitations/api";
import { mapInvitationError } from "@/features/invitations/errors";
import {
  useCreateEmailInvitationMutation,
  useCreateShareInvitationMutation,
} from "@/features/invitations/hooks";
import type { CreatedInvitation } from "@/types/models";
import { DEFAULT_INVITE_EXPIRY_HOURS } from "@/utils/invitationLink";
import { styles } from "./InviteTravellerScreen.styles";

type InviteMode = "email" | "link";

const ROLE_OPTIONS: InviteRole[] = ["editor", "viewer"];
const EXPIRY_OPTIONS: { hours: number; label: string }[] = [
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 336, label: "14 days" },
];

export function InviteTravellerScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const createEmailMutation = useCreateEmailInvitationMutation();
  const createShareMutation = useCreateShareInvitationMutation();

  const [mode, setMode] = useState<InviteMode>("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [expiresInHours, setExpiresInHours] = useState(DEFAULT_INVITE_EXPIRY_HOURS);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<
    (CreatedInvitation & { emailSent?: boolean; emailReason?: string }) | null
  >(null);
  const [copied, setCopied] = useState(false);

  const isSubmitting = createEmailMutation.isPending || createShareMutation.isPending;

  const onSubmit = async () => {
    if (!tripId) {
      setFormError("Trip is missing.");
      return;
    }

    setFormError(null);
    setCopied(false);

    try {
      if (mode === "email") {
        const result = await createEmailMutation.mutateAsync({
          tripId,
          email,
          role,
          expiresInHours,
          sendEmail: true,
        });
        setCreated(result);
      } else {
        const result = await createShareMutation.mutateAsync({
          tripId,
          role,
          expiresInHours,
        });
        setCreated(result);
      }
    } catch (error) {
      setFormError(mapInvitationError(error));
    }
  };

  const onCopy = async () => {
    if (!created) {
      return;
    }
    await Clipboard.setStringAsync(created.inviteLink);
    setCopied(true);
  };

  const onShare = async () => {
    if (!created) {
      return;
    }
    await Share.share({
      message: created.inviteLink,
      url: created.inviteLink,
    });
  };

  const onCreateAnother = () => {
    setCreated(null);
    setEmail("");
    setFormError(null);
    setCopied(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Invite traveller"
        subtitle="Email or shareable link"
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {created ? (
          <View style={styles.successBlock}>
            <Text style={styles.title}>Invitation ready</Text>
            <Text style={styles.body}>
              Share this link with your traveller. It expires automatically.
            </Text>
            <AppCard>
              <Text style={styles.linkLabel}>Invite link</Text>
              <Text style={styles.linkValue} selectable>
                {created.inviteLink}
              </Text>
            </AppCard>
            {mode === "email" ? (
              <Text style={styles.note}>
                {created.emailSent
                  ? `We also tried to email ${email.trim()}.`
                  : "Email delivery is not configured yet — share the link manually."}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <AppButton
                label={copied ? "Copied" : "Copy link"}
                variant="secondary"
                onPress={() => {
                  void onCopy();
                }}
              />
              <AppButton
                label="Share"
                onPress={() => {
                  void onShare();
                }}
              />
              <AppButton label="Invite another" variant="ghost" onPress={onCreateAnother} />
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.segmentRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "email" }}
                onPress={() => setMode("email")}
                style={[styles.segment, mode === "email" ? styles.segmentSelected : null]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === "email" ? styles.segmentLabelSelected : null,
                  ]}
                >
                  Email
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "link" }}
                onPress={() => setMode("link")}
                style={[styles.segment, mode === "link" ? styles.segmentSelected : null]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    mode === "link" ? styles.segmentLabelSelected : null,
                  ]}
                >
                  Share link
                </Text>
              </Pressable>
            </View>

            {mode === "email" ? (
              <AppTextInput
                label="Email"
                placeholder="traveller@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                editable={!isSubmitting}
              />
            ) : (
              <Text style={styles.body}>
                Anyone with the link can join as the role you choose. Share carefully.
              </Text>
            )}

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.chipRow}>
                {ROLE_OPTIONS.map((option) => {
                  const selected = role === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setRole(option)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                    >
                      <Text
                        style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}
                      >
                        {option === "editor" ? "Editor" : "Viewer"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Expires in</Text>
              <View style={styles.chipRow}>
                {EXPIRY_OPTIONS.map((option) => {
                  const selected = expiresInHours === option.hours;
                  return (
                    <Pressable
                      key={option.hours}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setExpiresInHours(option.hours)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}
                    >
                      <Text
                        style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <AppButton
              label={mode === "email" ? "Create email invite" : "Create share link"}
              loading={isSubmitting}
              disabled={isSubmitting || (mode === "email" && email.trim().length === 0)}
              onPress={() => {
                void onSubmit();
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
