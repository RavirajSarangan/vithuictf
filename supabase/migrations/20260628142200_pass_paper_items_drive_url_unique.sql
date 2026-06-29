-- Remove duplicate Drive links before enforcing uniqueness (keep earliest row)
DELETE FROM public.pass_paper_items a
WHERE a.id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY drive_url
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.pass_paper_items
  ) ranked
  WHERE rn > 1
);

-- Prevent duplicate Drive links on re-sync
CREATE UNIQUE INDEX IF NOT EXISTS pass_paper_items_drive_url_unique_idx
  ON public.pass_paper_items (drive_url);
