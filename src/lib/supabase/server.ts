import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const noopCookies = {
  getAll() {
    return [] as { name: string; value: string }[];
  },
  setAll() {
    // Public reads never mutate auth cookies.
  },
};

/** Cookie-less client for public marketing reads during static/ISR generation. */
export function createPublicClient() {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: noopCookies,
  });
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — middleware handles refresh
        }
      },
    },
  });
}
