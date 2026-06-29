ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS school_name text;

COMMENT ON COLUMN public.students.school_name IS 'Student school / institution name';
