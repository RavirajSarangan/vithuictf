-- Paper center staff manual WhatsApp delivery audit

ALTER TYPE public.whatsapp_message_type ADD VALUE IF NOT EXISTS 'manual_paper_center';
ALTER TYPE public.whatsapp_message_type ADD VALUE IF NOT EXISTS 'manual_paper_center_broadcast';

ALTER TABLE public.batch_whatsapp_log
  ADD COLUMN IF NOT EXISTS paper_center_id UUID REFERENCES public.paper_centers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paper_center_staff_id UUID REFERENCES public.paper_center_staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS batch_whatsapp_log_paper_center_type_idx
  ON public.batch_whatsapp_log(paper_center_id, message_type)
  WHERE paper_center_id IS NOT NULL;
