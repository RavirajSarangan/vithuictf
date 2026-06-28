-- Daily poster/post counts per content type (replaces yes/no-only tracking)
ALTER TABLE public.social_content_entries
  ADD COLUMN IF NOT EXISTS post_count INT NOT NULL DEFAULT 0 CHECK (post_count >= 0);

UPDATE public.social_content_entries
SET post_count = CASE WHEN posted THEN 1 ELSE 0 END
WHERE post_count = 0 AND posted = true;

UPDATE public.social_content_entries
SET posted = (post_count > 0);
