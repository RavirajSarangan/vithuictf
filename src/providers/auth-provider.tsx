"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/types";
import type { RegisterStudentInput } from "@/lib/validation/register-student";
import { createClient } from "@/lib/supabase/client";
import { mapProfile } from "@/lib/supabase/mappers";
import { loginInstituteStaff, registerStudentAccount, resolveStudentLoginEmail } from "@/lib/actions/auth";
import { EMAIL_PATTERN, LOGIN_ERROR } from "@/lib/auth/login-errors";
import { getComingSoonPath } from "@/lib/portal-access";

interface AuthContextValue {
  user: User | null;
  /** True until the first auth profile resolution attempt completes. */
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signInAsInstituteStaff: (staffUsername: string, email: string, password: string) => Promise<User>;
  signInAsAdmin: (email: string, password: string) => Promise<User>;
  signInAsContentTeam: (email: string, password: string) => Promise<User>;
  signInWithStudentId: (studentId: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  signOut: (redirectTo?: string) => Promise<void>;
  signUp: (input: RegisterStudentInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profilesEqual(a: User | null, b: User | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.role === b.role &&
    a.email === b.email &&
    a.displayName === b.displayName
  );
}

/**
 * Guards against open-redirect: only allow navigation to a same-origin target.
 * Returns a safe absolute URL string, or null if the target is off-origin/invalid.
 */
function resolveSameOriginTarget(target: string): string | null {
  try {
    const url = new URL(target, window.location.origin);
    return url.origin === window.location.origin ? url.toString() : null;
  } catch {
    return null;
  }
}

export function AuthProvider({
  children,
  deferred = false,
}: {
  children: React.ReactNode;
  /** When true, delays the first profile fetch until idle (marketing pages only). */
  deferred?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const loading = !initialized;

  const applyUser = useCallback((next: User | null) => {
    setUser((prev) => (profilesEqual(prev, next) ? prev : next));
  }, []);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      applyUser(null);
      return;
    }

    const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    if (!data) {
      applyUser(null);
      return;
    }

    const mapped = mapProfile(data);
    if (mapped.role === "student") {
      const { data: student } = await supabase
        .from("students")
        .select("active")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (student && student.active === false) {
        await supabase.auth.signOut();
        applyUser(null);
        return;
      }
    }

    applyUser(mapped);
  }, [applyUser]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const finishInit = () => {
      if (!cancelled) setInitialized(true);
    };

    const init = () => {
      void (async () => {
        try {
          await Promise.race([
            loadProfile(),
            new Promise<void>((_, reject) => {
              window.setTimeout(() => reject(new Error("auth profile timeout")), 8_000);
            }),
          ]);
        } catch (error) {
          if (!cancelled) {
            console.warn("Auth profile load failed:", error);
          }
        } finally {
          finishInit();
        }
      })();
    };

    let idleId: number | undefined;
    let timerId: number | undefined;

    if (deferred) {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(init, { timeout: 2500 });
      } else {
        timerId = window.setTimeout(init, 1500);
      }
    } else {
      init();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT") {
        applyUser(null);
        return;
      }
      void loadProfile();
    });

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
      subscription.unsubscribe();
    };
  }, [deferred, loadProfile, applyUser]);

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

      if (mapped.role === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("active")
          .eq("user_id", authData.user.id)
          .maybeSingle();
        if (student && student.active === false) {
          await supabase.auth.signOut();
          applyUser(null);
          throw new Error("Your account has been disabled. Contact the institute for assistance.");
        }
      }

      applyUser(mapped);
      setInitialized(true);
      return mapped;
    },
    [applyUser]
  );

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInAsInstituteStaff = useCallback(
    async (staffUsername: string, email: string, password: string): Promise<User> => {
      const result = await loginInstituteStaff(staffUsername, email, password);
      if (!result.ok) {
        throw new Error(result.code ?? result.error);
      }

      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Sign in failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const mapped = mapProfile(profile);
      applyUser(mapped);
      setInitialized(true);
      return mapped;
    },
    [applyUser]
  );

  const signInAsAdmin = useCallback(
    async (email: string, password: string): Promise<User> => {
      const normalized = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalized)) {
        throw new Error(LOGIN_ERROR.INVALID_EMAIL);
      }

      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (error) throw new Error(error.message);
      if (!authData.user) throw new Error("Sign in failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const mapped = mapProfile(profile);
      if (mapped.role !== "admin" && mapped.role !== "super_admin") {
        await supabase.auth.signOut();
        applyUser(null);
        throw new Error(
          mapped.role === "teacher" ? LOGIN_ERROR.STAFF_PORTAL_ONLY : LOGIN_ERROR.ADMIN_PORTAL_ONLY
        );
      }

      applyUser(mapped);
      setInitialized(true);
      return mapped;
    },
    [applyUser]
  );

  const signInAsContentTeam = useCallback(
    async (email: string, password: string): Promise<User> => {
      const normalized = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalized)) {
        throw new Error(LOGIN_ERROR.INVALID_EMAIL);
      }

      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (error) throw new Error(error.message);
      if (!authData.user) throw new Error("Sign in failed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const mapped = mapProfile(profile);
      if (mapped.role !== "content_manager") {
        await supabase.auth.signOut();
        applyUser(null);
        throw new Error(LOGIN_ERROR.CONTENT_TEAM_ONLY);
      }

      const { data: manager } = await supabase
        .from("content_managers")
        .select("active")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!manager?.active) {
        await supabase.auth.signOut();
        applyUser(null);
        throw new Error("Your content team account is deactivated. Contact an administrator.");
      }

      applyUser(mapped);
      setInitialized(true);
      return mapped;
    },
    [applyUser]
  );

  const signInWithStudentId = useCallback(
    async (studentId: string, password: string): Promise<User> => {
      const email = await resolveStudentLoginEmail(studentId);
      const signedIn = await signIn(email, password);
      if (signedIn.role !== "student") {
        const supabase = createClient();
        await supabase.auth.signOut();
        applyUser(null);
        throw new Error(LOGIN_ERROR.STUDENT_ID_ONLY);
      }

      return signedIn;
    },
    [signIn, applyUser]
  );

  const signUp = useCallback(async (input: RegisterStudentInput) => {
    const registration = await registerStudentAccount(input);
    if (!registration.ok) {
      throw new Error(registration.error);
    }

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
        applyUser(mapped);
        setInitialized(true);
        return;
      }

      lastError = new Error(error?.message ?? "Sign in failed");
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    throw lastError ?? new Error("Sign in failed after registration");
  }, [applyUser]);

  const signOut = useCallback(
    async (redirectTo?: string) => {
      const supabase = createClient();
      await supabase.auth.signOut();
      applyUser(null);
      if (redirectTo) {
        const safeTarget = resolveSameOriginTarget(redirectTo);
        if (safeTarget) {
          const { pathname, search } = new URL(safeTarget);
          router.replace(`${pathname}${search}`);
        } else {
          router.replace("/");
        }
      }
    },
    [router, applyUser]
  );

  const refreshUser = useCallback(async () => {
    await loadProfile();
    setInitialized(true);
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      loading,
      initialized,
      signIn,
      signInAsInstituteStaff,
      signInAsAdmin,
      signInAsContentTeam,
      signInWithStudentId,
      signInWithGoogle,
      signOut,
      signUp,
      refreshUser,
    }),
    [
      user,
      loading,
      initialized,
      signIn,
      signInAsInstituteStaff,
      signInAsAdmin,
      signInAsContentTeam,
      signInWithStudentId,
      signInWithGoogle,
      signOut,
      signUp,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function getRoleRedirect(role: UserRole): string {
  const comingSoon = getComingSoonPath(role);
  if (comingSoon) return comingSoon;

  switch (role) {
    case "admin":
    case "super_admin":
      return "/admin/dashboard";
    case "teacher":
      return "/academics/dashboard";
    case "content_manager":
      return "/staff/tracking";
    case "paper_center_staff":
      return "/paper-center/dashboard";
    case "parent":
      return "/parent/dashboard";
    default:
      return "/dashboard";
  }
}
