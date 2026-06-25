-- Singleton platform settings (online payments toggle, default tuition)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  online_payments_enabled BOOLEAN NOT NULL DEFAULT false,
  default_tuition_lkr NUMERIC(12, 2) NOT NULL DEFAULT 5000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id, online_payments_enabled, default_tuition_lkr)
VALUES (1, false, 5000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_public_read
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY platform_settings_admin_write
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
