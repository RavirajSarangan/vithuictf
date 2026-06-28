-- Certificate automation: templates, batches, sequences, extended certificates, storage

-- Templates
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  field_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  id_prefix TEXT NOT NULL DEFAULT 'foc-cert-2026',
  id_padding INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX certificate_templates_active_idx ON public.certificate_templates (is_active) WHERE is_active = true;

-- Batches
CREATE TABLE public.certificate_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  total_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX certificate_batches_status_idx ON public.certificate_batches (status);
CREATE INDEX certificate_batches_created_at_idx ON public.certificate_batches (created_at DESC);

-- Sequence counter per ID prefix (e.g. foc-cert-2026 -> 001, 002, ...)
CREATE TABLE public.certificate_sequences (
  prefix TEXT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_certificate_number(p_prefix TEXT, p_padding INT DEFAULT 3)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num INT;
BEGIN
  INSERT INTO public.certificate_sequences (prefix, last_number)
  VALUES (p_prefix, 1)
  ON CONFLICT (prefix) DO UPDATE
  SET last_number = public.certificate_sequences.last_number + 1
  RETURNING last_number INTO v_num;

  RETURN p_prefix || '-' || LPAD(v_num::TEXT, p_padding, '0');
END;
$$;

-- Extend certificates
ALTER TABLE public.certificates
  ALTER COLUMN student_id DROP NOT NULL,
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.certificate_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'email_sent', 'whatsapp_sent', 'failed')),
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS certificates_certificate_number_idx ON public.certificates (certificate_number);
CREATE INDEX IF NOT EXISTS certificates_batch_id_idx ON public.certificates (batch_id);
CREATE INDEX IF NOT EXISTS certificates_delivery_status_idx ON public.certificates (delivery_status);

-- RLS for new tables
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY certificate_templates_staff ON public.certificate_templates
  FOR ALL USING (public.is_staff());

CREATE POLICY certificate_batches_staff ON public.certificate_batches
  FOR ALL USING (public.is_staff());

CREATE POLICY certificate_sequences_staff ON public.certificate_sequences
  FOR ALL USING (public.is_staff());

-- Storage bucket for generated certificate PNGs (private, staff access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY certificates_storage_staff_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND public.is_staff());

CREATE POLICY certificates_storage_staff_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND public.is_staff());

CREATE POLICY certificates_storage_staff_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates' AND public.is_staff())
  WITH CHECK (bucket_id = 'certificates' AND public.is_staff());

CREATE POLICY certificates_storage_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND public.is_staff());

-- Seed default template field config (image_url set by app on first load)
INSERT INTO public.certificate_templates (name, image_url, field_config, is_active, id_prefix, id_padding)
SELECT
  'ICTF Certificate of Completion',
  '/landing/ICTF - Certificate.webp',
  '{
    "certificateNumber": { "x": 88, "y": 4.5, "fontSize": 14, "color": "#FFFFFF", "align": "right", "fontFamily": "Inter" },
    "studentName": { "x": 50, "y": 42, "fontSize": 52, "color": "#273461", "align": "center", "fontFamily": "DancingScript", "gradient": true },
    "courseName": { "x": 50, "y": 56, "fontSize": 26, "color": "#273461", "align": "center", "fontFamily": "Inter", "fontWeight": 700 },
    "issueDate": { "x": 82, "y": 82, "fontSize": 16, "color": "#273461", "align": "center", "fontFamily": "Inter", "format": "DD.MM.YYYY" }
  }'::jsonb,
  true,
  'foc-cert-2026',
  3
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_templates WHERE is_active = true);

INSERT INTO public.certificate_sequences (prefix, last_number)
VALUES ('foc-cert-2026', 0)
ON CONFLICT (prefix) DO NOTHING;
