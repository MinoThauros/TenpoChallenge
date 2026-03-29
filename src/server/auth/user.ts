import { redirect } from "next/navigation";
import { createSupabaseUserServerClient } from "@/server/supabase/server";

export type AuthenticatedAppUser = {
  id: string;
  email: string | null;
  academyId: string | null;
};

export async function getOptionalAuthenticatedAppUser(): Promise<AuthenticatedAppUser | null> {
  const supabase = await createSupabaseUserServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    academyId:
      typeof user.app_metadata?.academy_id === "string"
        ? user.app_metadata.academy_id
        : null,
  };
}

export async function requireAuthenticatedAppUser(nextPath: string) {
  const user = await getOptionalAuthenticatedAppUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export async function getRequiredAuthenticatedAppUser() {
  const user = await getOptionalAuthenticatedAppUser();

  if (!user) {
    throw new Error("Authenticated user was required but no Supabase session was found.");
  }

  return user;
}
