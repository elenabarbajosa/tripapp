import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppButton } from "@/components/ui/AppButton/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput/AppTextInput";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { PasswordTextInput } from "@/components/ui/PasswordTextInput/PasswordTextInput";
import { ScreenHeader } from "@/components/ui/ScreenHeader/ScreenHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePreview } from "@/features/preview/PreviewProvider";
import {
  signInSchema,
  signUpSchema,
  type SignInFormValues,
  type SignUpFormValues,
} from "@/validation/authSchemas";
import { styles } from "./EmailAuthScreen.styles";

type AuthMode = "signIn" | "signUp";

export function EmailAuthScreen() {
  const router = useRouter();
  const { isConfigured, configurationMessage, signInWithEmail, signUpWithEmail } = useAuth();
  const { exitPreview } = usePreview();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFormError(null);
  };

  const onSignIn = signInForm.handleSubmit(async (values) => {
    if (!isConfigured) {
      setFormError(configurationMessage);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      exitPreview();
      await signInWithEmail(values.email.trim(), values.password);
      router.replace("/(main)/home");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    if (!isConfigured) {
      setFormError(configurationMessage);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      exitPreview();
      const result = await signUpWithEmail({
        email: values.email.trim(),
        password: values.password,
        displayName: values.displayName.trim(),
      });

      if (result.requiresEmailConfirmation) {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link. Confirm your email, then sign in.",
          [{ text: "OK", onPress: () => switchMode("signIn") }],
        );
        return;
      }

      router.replace("/(main)/home");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title={mode === "signIn" ? "Email sign-in" : "Create account"}
        leftSlot={
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Go back"
            variant="ghost"
            onPress={() => router.back()}
          />
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {mode === "signIn" ? "Welcome back" : "Create your account"}
          </Text>
          <Text style={styles.body}>
            {mode === "signIn"
              ? "Sign in with your email to plan trips together."
              : "Set up your TripApp profile. You can invite travellers later."}
          </Text>

          {!isConfigured ? <Text style={styles.configMessage}>{configurationMessage}</Text> : null}
          {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

          {mode === "signIn" ? (
            <View style={styles.form}>
              <Controller
                control={signInForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <AppTextInput
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <Controller
                control={signInForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <PasswordTextInput
                    label="Password"
                    placeholder="Your password"
                    autoComplete="password"
                    textContentType="password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <AppButton
                label="Sign in"
                onPress={onSignIn}
                loading={isSubmitting}
                disabled={!isConfigured || isSubmitting}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Controller
                control={signUpForm.control}
                name="displayName"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <AppTextInput
                    label="Display name"
                    placeholder="Alex Rivera"
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <Controller
                control={signUpForm.control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <AppTextInput
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <Controller
                control={signUpForm.control}
                name="password"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <PasswordTextInput
                    label="Password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <Controller
                control={signUpForm.control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <PasswordTextInput
                    label="Confirm password"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorText={fieldState.error?.message}
                    editable={!isSubmitting}
                  />
                )}
              />
              <AppButton
                label="Create account"
                onPress={onSignUp}
                loading={isSubmitting}
                disabled={!isConfigured || isSubmitting}
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>
              {mode === "signIn" ? "New here?" : "Already have an account?"}
            </Text>
            <AppButton
              label={mode === "signIn" ? "Create an account" : "Sign in instead"}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
              disabled={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
