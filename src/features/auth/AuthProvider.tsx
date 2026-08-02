import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import type { Session, User } from "@supabase/supabase-js";

import {
  getGoogleConfigMessage,
  isGoogleSignInConfigured,
  isSupabaseConfigured,
} from "@/constants/config";
import {
  fetchProfileByUserId,
  getSupabaseClient,
  getSupabaseStatusMessage,
} from "@/services/supabase";
import type { ProfileSummary } from "@/types/models";
import { isAppleSignInAvailable, signInWithAppleIdToken } from "./appleSignIn";
import {
  AuthCancelledError,
  AuthNotConfiguredError,
  AuthUnavailableError,
  getAuthErrorMessage,
  getSocialAuthErrorMessage,
  isAuthCancelledError,
  logAuthErrorCategory,
  type SocialAuthProvider,
} from "./authErrors";
import { buildAuthState } from "./authState";
import { signInWithGoogleIdToken } from "./googleSignIn";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileSummary | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  configurationMessage: string;
  isGoogleSignInAvailable: boolean;
  isAppleSignInAvailable: boolean;
  socialAuthLoadingProvider: SocialAuthProvider | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ cancelled: boolean }>;
  signInWithApple: () => Promise<{ cancelled: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [isInitializing, setIsInitializing] = useState(() => isSupabaseConfigured());
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [socialAuthLoadingProvider, setSocialAuthLoadingProvider] =
    useState<SocialAuthProvider | null>(null);
  const profileRequestId = useRef(0);
  const loadedProfileUserId = useRef<string | null>(null);
  const socialAuthInFlight = useRef(false);

  const googleAvailable = isSupabaseConfigured() && isGoogleSignInConfigured();

  const loadProfile = useCallback(async (userId: string) => {
    const client = getSupabaseClient();
    if (!client) {
      setProfile(null);
      loadedProfileUserId.current = null;
      return;
    }

    const requestId = ++profileRequestId.current;
    setIsProfileLoading(true);

    try {
      const nextProfile = await fetchProfileByUserId(client, userId);
      if (requestId !== profileRequestId.current) {
        return;
      }
      loadedProfileUserId.current = userId;
      setProfile(nextProfile);
    } catch (error) {
      logAuthErrorCategory("profile_load", error);
      if (requestId !== profileRequestId.current) {
        return;
      }
      loadedProfileUserId.current = null;
      setProfile(null);
    } finally {
      if (requestId === profileRequestId.current) {
        setIsProfileLoading(false);
      }
    }
  }, []);

  const clearProfile = useCallback(() => {
    profileRequestId.current += 1;
    loadedProfileUserId.current = null;
    setProfile(null);
    setIsProfileLoading(false);
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    let isMounted = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }
      if (error) {
        logAuthErrorCategory("get_session", error);
        setSession(null);
        clearProfile();
        setIsInitializing(false);
        return;
      }

      setSession(data.session);
      if (data.session?.user) {
        void loadProfile(data.session.user.id).finally(() => {
          if (isMounted) {
            setIsInitializing(false);
          }
        });
      } else {
        clearProfile();
        setIsInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession?.user) {
        clearProfile();
        return;
      }

      if (loadedProfileUserId.current === nextSession.user.id) {
        return;
      }

      void loadProfile(nextSession.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearProfile, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    void isAppleSignInAvailable().then((available) => {
      if (isMounted) {
        setIsAppleAvailable(available);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const beginSocialAuth = useCallback((provider: SocialAuthProvider) => {
    if (socialAuthInFlight.current) {
      throw new AuthUnavailableError("Another sign-in attempt is already in progress.");
    }
    socialAuthInFlight.current = true;
    setSocialAuthLoadingProvider(provider);
  }, []);

  const endSocialAuth = useCallback(() => {
    socialAuthInFlight.current = false;
    setSocialAuthLoadingProvider(null);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error(getSupabaseStatusMessage());
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      logAuthErrorCategory("sign_in", error);
      throw new Error(getAuthErrorMessage(error));
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error(getSupabaseStatusMessage());
      }

      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            display_name: input.displayName,
          },
        },
      });

      if (error) {
        logAuthErrorCategory("sign_up", error);
        throw new Error(getAuthErrorMessage(error));
      }

      return {
        requiresEmailConfirmation: !data.session,
      };
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!googleAvailable) {
      throw new AuthNotConfiguredError(getGoogleConfigMessage());
    }

    beginSocialAuth("google");
    try {
      await signInWithGoogleIdToken();
      return { cancelled: false };
    } catch (error) {
      if (isAuthCancelledError(error)) {
        return { cancelled: true };
      }
      logAuthErrorCategory("google_sign_in", error);
      throw new Error(getSocialAuthErrorMessage("google", error));
    } finally {
      endSocialAuth();
    }
  }, [beginSocialAuth, endSocialAuth, googleAvailable]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      throw new AuthNotConfiguredError("Apple sign-in is only available on iOS.");
    }

    if (!isAppleAvailable) {
      throw new AuthNotConfiguredError(
        "Apple sign-in will be available after Sign in with Apple is configured for this app.",
      );
    }

    beginSocialAuth("apple");
    try {
      await signInWithAppleIdToken();
      return { cancelled: false };
    } catch (error) {
      if (isAuthCancelledError(error)) {
        return { cancelled: true };
      }
      logAuthErrorCategory("apple_sign_in", error);
      throw new Error(getSocialAuthErrorMessage("apple", error));
    } finally {
      endSocialAuth();
    }
  }, [beginSocialAuth, endSocialAuth, isAppleAvailable]);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      clearProfile();
      setSession(null);
      return;
    }

    const { error } = await client.auth.signOut();
    if (error) {
      logAuthErrorCategory("sign_out", error);
      throw new Error(getAuthErrorMessage(error));
    }
    clearProfile();
  }, [clearProfile]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }
    loadedProfileUserId.current = null;
    await loadProfile(userId);
  }, [loadProfile, session?.user?.id]);

  const snapshot = buildAuthState({
    session,
    profile,
    isInitializing,
    isProfileLoading,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      session: snapshot.session,
      user: snapshot.user,
      profile: snapshot.profile,
      isInitializing: snapshot.isInitializing,
      isAuthenticated: snapshot.isAuthenticated,
      isProfileLoading: snapshot.isProfileLoading,
      isConfigured: isSupabaseConfigured(),
      configurationMessage: getSupabaseStatusMessage(),
      isGoogleSignInAvailable: googleAvailable,
      isAppleSignInAvailable: isAppleAvailable,
      socialAuthLoadingProvider,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
    }),
    [
      snapshot.session,
      snapshot.user,
      snapshot.profile,
      snapshot.isInitializing,
      snapshot.isAuthenticated,
      snapshot.isProfileLoading,
      googleAvailable,
      isAppleAvailable,
      socialAuthLoadingProvider,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { AuthCancelledError };
