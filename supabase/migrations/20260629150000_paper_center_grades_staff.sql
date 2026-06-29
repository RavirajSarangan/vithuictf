-- Paper center grades + staff role, WhatsApp, and grade assignments

ALTER TABLE public.paper_centers
  ADD COLUMN IF NOT EXISTS grades TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.paper_center_staff
  ADD COLUMN IF NOT EXISTS staff_role TEXT NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS grades TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.paper_center_staff
  ADD CONSTRAINT paper_center_staff_role_check
  CHECK (staff_role IN ('in_charge', 'staff'));

CREATE UNIQUE INDEX IF NOT EXISTS paper_center_one_in_charge_idx
  ON public.paper_center_staff (paper_center_id)
  WHERE staff_role = 'in_charge' AND active = true;

-- Backfill existing centers with all grades so legacy rows remain valid
UPDATE public.paper_centers
SET grades = ARRAY['10', '11', '12', '13']
WHERE grades = '{}' OR grades IS NULL;
