"use server";

import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getRegistrationBackendStatus() {
  const supabaseConfigured = isSupabaseConfigured();
  const adminConfigured = isAdminClientConfigured();

  return {
    demoMode: !supabaseConfigured,
    registrationReady: supabaseConfigured && adminConfigured,
    missingServiceRole: supabaseConfigured && !adminConfigured,
  };
}
