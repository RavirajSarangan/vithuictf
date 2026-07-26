-- Phase 3 follow-up for the faculty academics backbone:
--
-- 1. The teacher-side course_batches/class_sessions tables picked up
--    zoom_link, cancel_reason/cancelled_at, and canva_slide_url/title in
--    later migrations (20260629170000, 20260629190400) that postdate the
--    faculty_batches/faculty_class_sessions tables created in
--    20260726091000_faculty_academics_batches.sql. The faculty action clone
--    (src/lib/actions/faculty-academics.ts) mirrors createBatch,
--    updateSessionCanvaSlide/clearSessionCanvaSlide, and cancelClassSession,
--    all of which read/write these columns, so we add matching columns here
--    to keep the faculty tables at parity. Automated WhatsApp reminder
--    columns (reminder_sent_at, last_class_notified_at,
--    last_class_eve_notified_at) are intentionally NOT mirrored — no faculty
--    action in this phase uses them.
ALTER TABLE public.faculty_batches
  ADD COLUMN IF NOT EXISTS zoom_link TEXT;

ALTER TABLE public.faculty_class_sessions
  ADD COLUMN IF NOT EXISTS zoom_link TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canva_slide_url TEXT,
  ADD COLUMN IF NOT EXISTS canva_slide_title TEXT;

-- 2. Students are a shared/global identity between the teacher and faculty
--    streams (by design — see the Phase 3 brief). The faculty enrollments
--    and students pages need to search/list students to enroll them into
--    faculty_batches, but public.is_staff() (used by the existing
--    students_select policy) only recognizes admin/super_admin/teacher —
--    adding faculty_staff to is_staff() would be far too broad, since that
--    function also gates FOR ALL (write) policies on courses, teachers,
--    parents, etc. Instead we add a narrow, SELECT-only policy so faculty
--    staff can read the roster without gaining any write access outside
--    their own faculty_* tables.
CREATE POLICY students_faculty_select ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'faculty_staff'
  )
);
