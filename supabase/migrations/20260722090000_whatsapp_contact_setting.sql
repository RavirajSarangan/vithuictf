-- Admin-editable WhatsApp contact number for the floating contact button.
-- NULL means "use the hardcoded BRAND.contact.whatsapp fallback" — nothing
-- breaks for existing deployments until a super admin sets this explicitly.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS whatsapp_contact_number TEXT;
