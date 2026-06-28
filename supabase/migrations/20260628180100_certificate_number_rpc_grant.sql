-- Allow staff clients to allocate certificate numbers via RPC
GRANT EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_certificate_number(TEXT, INT) TO service_role;
