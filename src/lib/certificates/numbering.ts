import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AppSupabase = SupabaseClient<Database>;

export async function allocateCertificateNumber(
  supabase: AppSupabase,
  prefix: string,
  padding = 3
): Promise<string> {
  const { data, error } = await supabase.rpc("next_certificate_number", {
    p_prefix: prefix,
    p_padding: padding,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to allocate certificate number");
  }

  return String(data);
}
