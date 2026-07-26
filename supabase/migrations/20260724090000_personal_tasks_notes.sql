-- Personal (strictly own-row) task manager + notepad for staff/admin
-- portals. Not shared/team data — every row is scoped to exactly the
-- user who created it, enforced by RLS, not just query filtering.

CREATE TABLE public.personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX personal_tasks_user_id_idx ON public.personal_tasks(user_id);
CREATE INDEX personal_tasks_due_date_idx ON public.personal_tasks(due_date);

ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_tasks_own_all ON public.personal_tasks
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.personal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX personal_notes_user_id_idx ON public.personal_notes(user_id);

ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY personal_notes_own_all ON public.personal_notes
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
