import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured };

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
