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
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/constants/config";
import {
  fetchProfileByUserId,
  getSupabaseClient,
  getSupabaseStatusMessage,
} from "@/services/supabase";
import type { ProfileSummary } from "@/types/models";
import { getAuthErrorMessage, logAuthErrorCategory } from "./authErrors";
import { buildAuthState } from "./authState";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileSummary | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  configurationMessage: string;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [isInitializing, setIsInitializing] = useState(() => isSupabaseConfigured());
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const profileRequestId = useRef(0);
  const loadedProfileUserId = useRef<string | null>(null);

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
      signInWithEmail,
      signUpWithEmail,
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
      signInWithEmail,
      signUpWithEmail,
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
