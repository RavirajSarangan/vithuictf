-- Per-class session billing (1,200 LKR default per attended session)

CREATE TYPE public.session_charge_status AS ENUM ('pending', 'paid', 'waived', 'void');

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS per_class_fee_lkr NUMERIC(12, 2) NOT NULL DEFAULT 1200;

CREATE TABLE public.session_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attendance_record_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK (amount_lkr >= 0),
  status public.session_charge_status NOT NULL DEFAULT 'pending',
  billing_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX session_charges_student_status_idx ON public.session_charges(student_id, status);
CREATE INDEX session_charges_course_month_idx ON public.session_charges(course_id, billing_month);
CREATE INDEX session_charges_batch_idx ON public.session_charges(batch_id);
CREATE INDEX session_charges_billing_month_idx ON public.session_charges(billing_month);

CREATE TABLE public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  session_charge_id UUID NOT NULL REFERENCES public.session_charges(id) ON DELETE CASCADE,
  amount_lkr NUMERIC(12, 2) NOT NULL CHECK (amount_lkr > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, session_charge_id)
);

CREATE INDEX payment_allocations_charge_idx ON public.payment_allocations(session_charge_id);

-- Auto-sync charges when attendance is marked
CREATE OR REPLACE FUNCTION public.sync_session_charge_from_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_fee NUMERIC(12, 2);
  v_session_id UUID;
  v_student_id UUID;
BEGIN
  v_session_id := COALESCE(NEW.session_id, OLD.session_id);
  v_student_id := COALESCE(NEW.student_id, OLD.student_id);

  SELECT s.id, s.batch_id, s.scheduled_date, s.status, b.course_id
  INTO v_session
  FROM public.class_sessions s
  JOIN public.course_batches b ON b.id = s.batch_id
  WHERE s.id = v_session_id;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_session.status = 'cancelled' THEN
    UPDATE public.session_charges
    SET status = 'void', updated_at = now()
    WHERE session_id = v_session.id AND status = 'pending';
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(per_class_fee_lkr, 1200) INTO v_fee
  FROM public.platform_settings WHERE id = 1;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.session_charges
    SET status = 'void', updated_at = now()
    WHERE session_id = OLD.session_id
      AND student_id = OLD.student_id
      AND status = 'pending';
    RETURN OLD;
  END IF;

  IF NEW.status IN ('present', 'late') THEN
    INSERT INTO public.session_charges (
      student_id, session_id, batch_id, course_id,
      attendance_record_id, amount_lkr, status, billing_month
    )
    VALUES (
      NEW.student_id, NEW.session_id, v_session.batch_id, v_session.course_id,
      NEW.id, v_fee, 'pending', date_trunc('month', v_session.scheduled_date)::date
    )
    ON CONFLICT (session_id, student_id) DO UPDATE SET
      attendance_record_id = EXCLUDED.attendance_record_id,
      amount_lkr = EXCLUDED.amount_lkr,
      billing_month = EXCLUDED.billing_month,
      status = CASE
        WHEN public.session_charges.status IN ('paid', 'waived') THEN public.session_charges.status
        ELSE 'pending'
      END,
      updated_at = now();
  ELSE
    UPDATE public.session_charges
    SET status = 'void', updated_at = now()
    WHERE session_id = NEW.session_id
      AND student_id = NEW.student_id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER attendance_sync_session_charge
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_session_charge_from_attendance();

-- Void pending charges when a session is cancelled
CREATE OR REPLACE FUNCTION public.void_session_charges_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.session_charges
    SET status = 'void', updated_at = now()
    WHERE session_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER class_session_cancel_void_charges
  AFTER UPDATE OF status ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.void_session_charges_on_cancel();

-- Per-student per-course billing summary
CREATE OR REPLACE VIEW public.student_billing_summary AS
SELECT
  sc.student_id,
  sc.course_id,
  c.name AS course_name,
  COUNT(*) FILTER (WHERE sc.status IN ('pending', 'paid')) AS sessions_billed,
  COALESCE(SUM(sc.amount_lkr) FILTER (WHERE sc.status IN ('pending', 'paid')), 0) AS total_charged_lkr,
  COALESCE(SUM(sc.amount_lkr) FILTER (WHERE sc.status = 'paid'), 0) AS total_paid_lkr,
  COALESCE(SUM(sc.amount_lkr) FILTER (WHERE sc.status = 'pending'), 0) AS total_outstanding_lkr
FROM public.session_charges sc
JOIN public.courses c ON c.id = sc.course_id
GROUP BY sc.student_id, sc.course_id, c.name;

ALTER TABLE public.session_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_charges_admin_all ON public.session_charges
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY session_charges_staff_read ON public.session_charges
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.class_sessions s
      JOIN public.course_batches b ON b.id = s.batch_id
      WHERE s.id = session_id AND public.teacher_can_access_course(b.course_id)
    )
  );

CREATE POLICY payment_allocations_admin_all ON public.payment_allocations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
