ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NOT NULL DEFAULT '';
