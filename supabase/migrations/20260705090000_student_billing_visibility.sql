-- Students and parents can see their own billing data (charges, payments,
-- allocations). Drives the student /payments page and the parent dues card via
-- the security-invoker student_billing_summary view. Also adds fee_reminder_log
-- for idempotent monthly fee-due reminders.

CREATE POLICY session_charges_own_select ON public.session_charges
  FOR SELECT TO authenticated
  USING (
    student_id = public.own_student_id()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY payments_own_select ON public.payments
  FOR SELECT TO authenticated
  USING (
    student_id = public.own_student_id()
    OR public.is_parent_of(student_id)
  );

-- payment_allocations references session_charges (RLS-protected), so route the
-- check through a SECURITY DEFINER helper instead of an inline subquery.
CREATE OR REPLACE FUNCTION public.can_view_session_charge(p_charge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_charges sc
    WHERE sc.id = p_charge_id
      AND (sc.student_id = public.own_student_id() OR public.is_parent_of(sc.student_id))
  );
$$;

CREATE POLICY payment_allocations_own_select ON public.payment_allocations
  FOR SELECT TO authenticated
  USING (public.can_view_session_charge(session_charge_id));

-- One reminder per student per billing month.
CREATE TABLE public.fee_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  outstanding_lkr NUMERIC(12, 2) NOT NULL,
  channel TEXT NOT NULL DEFAULT 'portal+email',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, billing_month)
);

CREATE INDEX fee_reminder_log_month_idx ON public.fee_reminder_log(billing_month);

ALTER TABLE public.fee_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY fee_reminder_log_admin_all ON public.fee_reminder_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
