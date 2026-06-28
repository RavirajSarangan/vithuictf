"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentData } from "@/hooks/use-data";
import { createClient } from "@/lib/supabase/client";
import {
  completeStudentOnboarding,
  updateStudentOnboardingSteps,
} from "@/lib/actions/onboarding";
import { canFinishOnboarding, countCompletedPortalSteps } from "@/lib/onboarding/student-steps";

export function useStudentOnboarding() {
  const { user, initialized } = useAuth();
  const student = useStudentData();
  const [stepsOverride, setStepsOverride] = useState<Record<string, boolean> | null>(null);
  const [completedAtOverride, setCompletedAtOverride] = useState<string | null | undefined>(undefined);

  const steps = useMemo(
    () => stepsOverride ?? student?.onboardingSteps ?? {},
    [stepsOverride, student?.onboardingSteps]
  );
  const completedAt =
    completedAtOverride !== undefined
      ? completedAtOverride
      : (student?.onboardingCompletedAt ?? null);
  const hydrated = initialized && (!user || student !== undefined);

  const isComplete = Boolean(completedAt);

  const portalProgress = useMemo(() => countCompletedPortalSteps(steps), [steps]);
  const canFinish = useMemo(() => canFinishOnboarding(steps), [steps]);

  const persistSteps = useCallback(
    async (next: Record<string, boolean>) => {
      setStepsOverride(next);
      if (!user) return;
      await updateStudentOnboardingSteps(next);
    },
    [user]
  );

  const markStep = useCallback(
    async (stepId: string, done = true) => {
      if (steps[stepId] === done) return;
      const next = { ...steps, [stepId]: done };
      await persistSteps(next);
    },
    [steps, persistSteps]
  );

  const finish = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setCompletedAtOverride(now);
    await completeStudentOnboarding();
  }, [user]);

  const resetForReplay = useCallback(async () => {
    if (!user) return;
    setCompletedAtOverride(null);
    const supabase = createClient();
    await supabase
      .from("students")
      .update({ onboarding_completed_at: null })
      .eq("user_id", user.id);
  }, [user]);

  return {
    hydrated,
    steps,
    isComplete,
    portalProgress,
    canFinish,
    markStep,
    persistSteps,
    finish,
    resetForReplay,
    student: student ?? null,
  };
}
