import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, isUserRole, type UserRole } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { supabase, user } = await getSessionUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status === "inactive") redirect("/login?error=inactive");
  return profile;
}

export async function requireRole(role: UserRole) {
  const profile = await requireProfile();
  if (profile.role !== role) redirect(homeForRole(profile.role));
  return profile;
}

export function assertRole(profile: Profile | null, role: UserRole): profile is Profile {
  return !!profile && isUserRole(profile.role) && profile.role === role;
}
