-- Track student enrollment time for admin/teacher activity feeds.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS students_created_at_idx ON public.students (created_at DESC);
