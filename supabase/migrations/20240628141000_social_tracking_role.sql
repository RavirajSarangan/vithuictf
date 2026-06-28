-- Must run in its own migration: new enum values cannot be used in the same transaction.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'content_manager';
