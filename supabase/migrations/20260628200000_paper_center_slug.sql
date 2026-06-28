-- Per-center login URLs: /login/paper-center/{slug}
ALTER TABLE public.paper_centers
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.paper_centers
SET slug = lower(
  trim(both '-' from regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g'))
)
WHERE slug IS NULL OR slug = '';

UPDATE public.paper_centers
SET slug = concat('center-', left(id::text, 8))
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.paper_centers
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS paper_centers_slug_idx ON public.paper_centers (slug);
