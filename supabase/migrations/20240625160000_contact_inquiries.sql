-- Contact form inquiries from marketing site
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx ON contact_inquiries (status, created_at DESC);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit contact inquiries"
  ON contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read contact inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (is_staff());

CREATE POLICY "Staff can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());
