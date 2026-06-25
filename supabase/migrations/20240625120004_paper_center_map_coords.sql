-- Map pin coordinates for paper centers (percentage on Sri Lanka map)

ALTER TABLE public.paper_centers
  ADD COLUMN IF NOT EXISTS map_x REAL,
  ADD COLUMN IF NOT EXISTS map_y REAL;

INSERT INTO public.paper_centers (name, district, address, sort_order)
SELECT 'ICTF Jaffna Paper Center', 'Jaffna', 'Jaffna Town', 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.paper_centers WHERE district ILIKE 'Jaffna'
);

UPDATE public.paper_centers SET map_x = 52, map_y = 14 WHERE district ILIKE 'Jaffna' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 36, map_y = 72 WHERE district ILIKE 'Colombo' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 56, map_y = 58 WHERE district ILIKE 'Kandy' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 40, map_y = 48 WHERE district ILIKE 'Kurunegala' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 46, map_y = 88 WHERE district ILIKE 'Galle' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 78, map_y = 52 WHERE district ILIKE 'Batticaloa' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 72, map_y = 38 WHERE district ILIKE 'Trincomalee' AND map_x IS NULL;
