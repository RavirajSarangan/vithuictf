-- Fix SECURITY DEFINER view: enforce RLS of the querying user on underlying tables.

CREATE OR REPLACE VIEW public.student_billing_summary
WITH (security_invoker = true)
AS
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

-- Belt-and-suspenders: only admins may select the billing summary view directly.
REVOKE ALL ON public.student_billing_summary FROM PUBLIC;
REVOKE ALL ON public.student_billing_summary FROM anon;
GRANT SELECT ON public.student_billing_summary TO authenticated;
