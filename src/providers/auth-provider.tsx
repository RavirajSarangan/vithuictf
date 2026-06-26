"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User, UserRole } from "@/types";
import type { RegisterStudentInput } from "@/lib/validation/register-student";
import { createClient } from "@/lib/supabase/client";
import { mapProfile } from "@/lib/supabase/mappers";
import { signUpWithRole, resolveStudentLoginEmail } from "@/lib/actions/auth";
import { EMAIL_PATTERN, LOGIN_ERROR } from "@/lib/auth/login-errors";
import { getComingSoonPath } from "@/lib/portal-access";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signInAsStaff: (email: string, password: string) => Promise<User>;
  signInWithStudentId: (studentId: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: RegisterStudentInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      return;
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    setUser(data ? mapProfile(data) : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadProfile();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<User> => {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!authData.user) throw new Error("Sign in failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const mapped = mapProfile(profile);
      const comingSoon = getComingSoonPath(mapped.role);
      if (comingSoon) {
        await supabase.auth.signOut();
        throw new Error("This portal is coming soon. Please use the student portal.");
      }

      setUser(mapped);
      return mapped;
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInAsStaff = useCallback(
    async (email: string, password: string): Promise<User> => {
      const normalized = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalized)) {
        throw new Error(LOGIN_ERROR.INVALID_EMAIL);
      }

      const user = await signIn(normalized, password);
      if (user.role !== "admin") {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        throw new Error(LOGIN_ERROR.STAFF_EMAIL_ONLY);
      }

      return user;
    },
    [signIn]
  );

  const signInWithStudentId = useCallback(
    async (studentId: string, password: string): Promise<User> => {
      const email = await resolveStudentLoginEmail(studentId);
      const user = await signIn(email, password);
      if (user.role !== "student") {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        throw new Error(LOGIN_ERROR.STUDENT_ID_ONLY);
      }

      return user;
    },
    [signIn]
  );

  const signUp = useCallback(async (input: RegisterStudentInput) => {
    await signUpWithRole(input.email, input.password, input.displayName, "student", input);

    const supabase = createClient();
    const email = input.email.trim().toLowerCase();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });

      if (!error && authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error(
            "Account was created but your profile is not ready yet. Wait a moment and try logging in."
          );
        }

        const mapped = mapProfile(profile);
        setUser(mapped);
        return;
      }

      lastError = new Error(error?.message ?? "Sign in failed");
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    throw lastError ?? new Error("Sign in failed after registration");
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signInAsStaff,
      signInWithStudentId,
      signInWithGoogle,
      signOut,
      signUp,
      refreshUser,
    }),
    [user, loading, signIn, signInAsStaff, signInWithStudentId, signInWithGoogle, signOut, signUp, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRoleRedirect(role: UserRole): string {
  const comingSoon = getComingSoonPath(role);
  if (comingSoon) return comingSoon;

  switch (role) {
    case "admin":
    case "teacher":
      return "/admin/dashboard";
    case "parent":
      return "/parent/dashboard";
    default:
      return "/dashboard";
  }
}
