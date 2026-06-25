"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateStudentOnboardingSteps(steps: Record<string, boolean>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("students")
    .update({ onboarding_steps: steps })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function completeStudentOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("students")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function updateStudentPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Use at least 8 characters");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}
