-- Admin action audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_user_idx ON admin_actions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON admin_actions (created_at DESC);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read audit log"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (is_staff());

CREATE POLICY "Staff can insert audit log"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_staff() AND user_id = auth.uid());
