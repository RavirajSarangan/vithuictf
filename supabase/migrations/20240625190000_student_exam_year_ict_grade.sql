-- A/L exam year and optional O/L ICT grade level for student registration
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS exam_year text,
  ADD COLUMN IF NOT EXISTS ict_grade text;
