-- Student onboarding progress
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_steps jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Students can update their own onboarding fields
CREATE POLICY students_self_update ON public.students
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
