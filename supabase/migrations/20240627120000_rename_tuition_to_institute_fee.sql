-- Rename default tuition fee column to institute fee terminology
ALTER TABLE public.platform_settings
  RENAME COLUMN default_tuition_lkr TO default_institute_fee_lkr;
