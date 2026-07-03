-- Add birthday support to ICTF team members for automatic birthday wish emails.
ALTER TABLE public.ictf_team_members ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.ictf_team_members ADD COLUMN IF NOT EXISTS last_birthday_wish_sent date;

COMMENT ON COLUMN public.ictf_team_members.date_of_birth IS 'Member date of birth; used by the daily birthday-wish email cron.';
COMMENT ON COLUMN public.ictf_team_members.last_birthday_wish_sent IS 'Colombo calendar date of the last automatic birthday email, for cron idempotency.';
