import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh the auth session on matched requests so server components and route
  // handlers read the latest user cookie state.
  await supabase.auth.getUser();

  return response;
}
