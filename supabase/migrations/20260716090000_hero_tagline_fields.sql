-- Admin-editable hero badge/title/accent text, previously hardcoded in
-- src/lib/i18n/marketing-ui.ts. Seeded with the current copy so the live
-- site's wording doesn't change until an admin edits it.
ALTER TABLE public.home_about
  ADD COLUMN IF NOT EXISTS hero_badge TEXT NOT NULL DEFAULT 'ICTF Institute · Jaffna',
  ADD COLUMN IF NOT EXISTS hero_badge_ta TEXT NOT NULL DEFAULT 'ICTF நிறுவனம் · யாழ்ப்பாணம்',
  ADD COLUMN IF NOT EXISTS hero_title TEXT NOT NULL DEFAULT 'O/L & A/L ICT Institute',
  ADD COLUMN IF NOT EXISTS hero_title_ta TEXT NOT NULL DEFAULT 'O/L & A/L ICT நிறுவனம்',
  ADD COLUMN IF NOT EXISTS hero_accent TEXT NOT NULL DEFAULT 'Islandwide',
  ADD COLUMN IF NOT EXISTS hero_accent_ta TEXT NOT NULL DEFAULT 'தீவு முழுவதும்';
