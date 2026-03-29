import { NextResponse } from "next/server";
import { createSupabaseUserServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseUserServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}
