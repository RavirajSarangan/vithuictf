-- Student registration approval workflow
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (registration_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS registration_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_reviewed_by UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_students_registration_status ON students (registration_status);
