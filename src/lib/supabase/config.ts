// Keep these reads explicit so Next can inline the public variables into the
// client bundle. Dynamic `process.env[name]` access is easy to miss and can
// fail at runtime in client code even when `.env.local` is present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function assertValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

export function getSupabaseUrl() {
  return assertValue(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return assertValue(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
