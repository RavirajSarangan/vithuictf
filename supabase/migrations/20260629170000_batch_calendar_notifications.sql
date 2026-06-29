-- Batch calendar notifications, Zoom links, WhatsApp delivery log

ALTER TABLE public.course_batches
  ADD COLUMN IF NOT EXISTS zoom_link TEXT;

ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS zoom_link TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_class_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_class_eve_notified_at TIMESTAMPTZ;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN NOT NULL DEFAULT true;

ALTER TYPE public.notification_type RENAME TO notification_type_old;
CREATE TYPE public.notification_type AS ENUM ('result', 'announcement', 'achievement', 'class');
ALTER TABLE public.notifications
  ALTER COLUMN type TYPE public.notification_type
  USING (
    CASE type::text
      WHEN 'attendance' THEN 'announcement'::public.notification_type
      ELSE type::text::public.notification_type
    END
  );
DROP TYPE public.notification_type_old;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE TYPE public.whatsapp_message_type AS ENUM (
  'last_class',
  'last_class_eve',
  'manual_batch',
  'manual_broadcast',
  'class_cancel',
  'class_reminder'
);

CREATE TYPE public.whatsapp_delivery_status AS ENUM ('pending', 'sent', 'failed', 'skipped');

CREATE TABLE public.batch_whatsapp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.course_batches(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  phone TEXT NOT NULL DEFAULT '',
  message_type public.whatsapp_message_type NOT NULL,
  message_title TEXT NOT NULL DEFAULT '',
  message_body TEXT NOT NULL DEFAULT '',
  status public.whatsapp_delivery_status NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error TEXT,
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX batch_whatsapp_log_batch_idx ON public.batch_whatsapp_log(batch_id);
CREATE INDEX batch_whatsapp_log_session_student_idx ON public.batch_whatsapp_log(session_id, student_id, message_type);

CREATE UNIQUE INDEX batch_whatsapp_log_automated_unique
  ON public.batch_whatsapp_log(session_id, student_id, message_type)
  WHERE session_id IS NOT NULL
    AND message_type IN ('last_class', 'last_class_eve', 'class_reminder', 'class_cancel');

ALTER TABLE public.batch_whatsapp_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_whatsapp_log_staff_select ON public.batch_whatsapp_log
  FOR SELECT USING (
    public.is_admin()
    OR (
      batch_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.course_batches b
        WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
      )
    )
  );

CREATE POLICY batch_whatsapp_log_staff_insert ON public.batch_whatsapp_log
  FOR INSERT WITH CHECK (public.is_admin() OR public.teacher_can_access_course(
    (SELECT course_id FROM public.course_batches WHERE id = batch_id)
  ));

-- Allow academics staff to insert student notifications
DROP POLICY IF EXISTS notifications_admin_insert ON public.notifications;
CREATE POLICY notifications_staff_insert ON public.notifications
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin', 'super_admin')
    )
  );
