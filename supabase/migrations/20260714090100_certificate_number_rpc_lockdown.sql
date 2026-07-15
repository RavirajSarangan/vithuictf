-- The previous migration only revoked EXECUTE from `authenticated`, but Postgres
-- grants EXECUTE on new functions to PUBLIC by default — so `anon` (and any other
-- role) could still call next_certificate_number() directly and burn sequence
-- numbers. Revoke from PUBLIC explicitly and keep the service-role grant, since
-- every caller now goes through a server action using the admin client.
REVOKE EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) TO service_role;
