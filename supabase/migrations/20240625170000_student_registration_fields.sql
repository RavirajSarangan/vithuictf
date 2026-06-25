-- Extended student registration fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS index_number text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS students_username_lower_idx
  ON public.students (lower(username))
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_index_number_lower_idx
  ON public.students (lower(index_number))
  WHERE index_number IS NOT NULL;
