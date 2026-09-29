"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "@/lib/validations/auth";
import { homeForRole, isUserRole } from "@/lib/auth/roles";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unable to start session" };

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
  if (profile?.status === "inactive") {
    await supabase.auth.signOut();
    return { error: "This account is inactive. Contact an administrator." };
  }
  if (!isUserRole(profile?.role)) return { error: "Profile is missing a role. Run the database migration and seed." };
  redirect(homeForRole(profile.role));
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: formString(formData, "fullName"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
    role: formString(formData, "role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  });
  if (error) return { error: error.message };
  return { success: "Account created. Check your email if confirmation is required, then log in." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formString(formData, "email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: "If that email exists, a reset link is on its way." };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: "Password updated. You can now use your new password." };
}
