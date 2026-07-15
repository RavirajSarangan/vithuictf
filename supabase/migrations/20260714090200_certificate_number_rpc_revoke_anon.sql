-- Supabase's default privileges auto-grant EXECUTE on new public-schema functions
-- to anon/authenticated/service_role at creation time, independent of PUBLIC and
-- any explicit GRANT statements in the function's own migration. Revoking from
-- PUBLIC alone left the `anon` role's separate default-privilege grant intact,
-- so anonymous requests could still call next_certificate_number() directly and
-- burn sequence numbers. Revoke from anon explicitly; service_role keeps access.
REVOKE EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) FROM anon;
