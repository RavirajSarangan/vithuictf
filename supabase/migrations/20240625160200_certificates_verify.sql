ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS verify_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS certificates_verify_code_idx ON public.certificates (verify_code);

-- Teacher course assignments for scoped staff access
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS course_ids UUID[] NOT NULL DEFAULT '{}';
