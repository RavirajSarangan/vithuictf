-- Public certificate claim links: one shareable URL per course/campaign that lets
-- students self-serve their own certificate by submitting name + email.

CREATE TABLE public.certificate_claim_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  max_claims INT,
  claim_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX certificate_claim_links_status_idx ON public.certificate_claim_links (status);

ALTER TABLE public.certificate_claim_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY certificate_claim_links_staff ON public.certificate_claim_links
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Public/anon may look up an active link by slug so the claim page can render
-- course name/status without a session. The actual claim mutation always goes
-- through the service-role client in a server action, never this policy.
CREATE POLICY certificate_claim_links_public_select ON public.certificate_claim_links
  FOR SELECT USING (status = 'active');

-- Link issued certificates back to the claim link that produced them
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS claim_link_id UUID REFERENCES public.certificate_claim_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS certificates_claim_link_id_idx ON public.certificates (claim_link_id);

-- Race-safe "one certificate per email per link". This is what makes the
-- reserve-then-complete flow atomic: a concurrent double-submit for the same
-- email hits this constraint instead of creating two rows / burning two IDs.
CREATE UNIQUE INDEX certificates_claim_link_email_uidx
  ON public.certificates (claim_link_id, lower(recipient_email))
  WHERE claim_link_id IS NOT NULL AND recipient_email IS NOT NULL;

-- Uppercase the certificate ID format (foc-cert-2026-001 -> FOC-CERT-2026-001).
-- Only touch rows still on the exact old default so any admin-customized
-- prefix on other templates is left untouched.
UPDATE public.certificate_templates
  SET id_prefix = upper(id_prefix), updated_at = now()
  WHERE id_prefix = 'foc-cert-2026';

ALTER TABLE public.certificate_templates
  ALTER COLUMN id_prefix SET DEFAULT 'FOC-CERT-2026';

-- Preserve the running counter in place (rename, don't reset) so new
-- uppercase numbers continue after the last lowercase one issued, instead of
-- restarting at 001 and colliding with already-issued certificates.
UPDATE public.certificate_sequences
  SET prefix = upper(prefix)
  WHERE prefix = 'foc-cert-2026';

-- Every caller now allocates numbers through a server action using the
-- service-role client (staff actions already did; the new public claim flow
-- does too). No code path should call this directly from the browser.
REVOKE EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) FROM authenticated;
