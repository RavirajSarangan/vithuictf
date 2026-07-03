-- Per-class-session Canva presentation slide URLs for student portal viewing.

ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS canva_slide_url TEXT,
  ADD COLUMN IF NOT EXISTS canva_slide_title TEXT;

COMMENT ON COLUMN public.class_sessions.canva_slide_url IS 'Original Canva design share URL assigned to this class session';
COMMENT ON COLUMN public.class_sessions.canva_slide_title IS 'Optional display title for the Canva slide deck';
