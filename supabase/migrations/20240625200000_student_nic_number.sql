ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS nic_number text;

CREATE UNIQUE INDEX IF NOT EXISTS students_nic_number_lower_idx
  ON public.students (lower(nic_number))
  WHERE nic_number IS NOT NULL;
