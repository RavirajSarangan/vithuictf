-- English + Tamil fields for home CMS sections

ALTER TABLE public.network_stats
  ADD COLUMN IF NOT EXISTS headline_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subheadline_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label_ta TEXT NOT NULL DEFAULT '';

ALTER TABLE public.class_programs
  ADD COLUMN IF NOT EXISTS title_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

ALTER TABLE public.home_about
  ADD COLUMN IF NOT EXISTS title_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio_ta TEXT NOT NULL DEFAULT '';

UPDATE public.network_stats SET
  headline_ta = 'எங்கள் பேப்பர் மைய நெட்வொர்க்',
  subheadline_ta = 'தீவு முழுவதும் தேர்வு தயாரிப்பு மையங்கள்',
  cta_label_ta = 'பேப்பர் மையங்களைப் பார்க்க'
WHERE id = 1;
