import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

// This client is intentionally user-scoped. It uses the public anon key plus
// the authenticated user's Supabase session cookies, which means database
// access flows through RLS instead of bypassing it with a service role key.
export async function createSupabaseUserServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
                cookieStore.set(name, value, options);
              },
            );
          } catch {
            // Route handlers can usually write auth cookies. If this helper is
            // used in a read-only server context, ignore the write attempt.
          }
        },
      },
    },
  );
}
