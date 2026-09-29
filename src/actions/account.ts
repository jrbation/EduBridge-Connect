"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { linkChildSchema, messageSchema, paymentSchema } from "@/lib/validations/academic";
import { profileSchema } from "@/lib/validations/auth";
import { notify } from "@/lib/data/records";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function sendMessageAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = messageSchema.safeParse({
    receiverId: str(formData, "receiverId"),
    content: str(formData, "content"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    sender_id: profile.id,
    receiver_id: parsed.data.receiverId,
    content: parsed.data.content,
  });
  if (error) return { error: error.message };
  await notify(parsed.data.receiverId, "New message", `${profile.full_name} sent you a message.`, "message");
  revalidatePath(`/${profile.role}/messages`);
  return { success: "Message sent" };
}

export async function markNotificationsReadAction() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  revalidatePath(`/${profile.role}/notifications`);
  return { success: "Notifications marked read" };
}

export async function updateProfileAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse({
    fullName: str(formData, "fullName"),
    phone: str(formData, "phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  const supabase = await createClient();
  const file = formData.get("avatar");
  let avatarUrl = profile.avatar_url;
  if (file instanceof File && file.size > 0) {
    if (file.size > 3 * 1024 * 1024) return { error: "Avatar must be 3MB or smaller" };
    const path = `${profile.id}/avatar-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError.message };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = data.publicUrl;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null, avatar_url: avatarUrl })
    .eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath(`/${profile.role}/profile`);
  return { success: "Profile updated" };
}

export async function linkChildAction(formData: FormData) {
  await requireRole("parent");
  const parsed = linkChildSchema.safeParse({
    code: str(formData, "code"),
    relationship: str(formData, "relationship") || "guardian",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_child_with_code", {
    p_code: parsed.data.code,
    p_relationship: parsed.data.relationship,
  });
  if (error) return { error: error.message };
  revalidatePath("/parent/children");
  return { success: "Child linked" };
}

export async function adminCreateAnnouncementAction(formData: FormData) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    author_id: profile.id,
    title: str(formData, "title"),
    content: str(formData, "content"),
    audience: (str(formData, "audience") || "all") as "all" | "students" | "parents" | "teachers",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return { success: "Announcement posted" };
}

export async function setAccountStatusAction(formData: FormData) {
  const admin = await requireRole("admin");
  const supabase = await createClient();
  const userId = str(formData, "userId");
  const status = str(formData, "status") as "active" | "inactive";
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) return { error: error.message };
  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: status === "inactive" ? "deactivate_user" : "activate_user",
    entity: "profiles",
    entity_id: userId,
  });
  revalidatePath("/admin/users");
  return { success: "Account updated" };
}

export async function createSchoolAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("schools").insert({
    name: str(formData, "name"),
    address: str(formData, "address") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/schools");
  return { success: "School created" };
}

export async function createPaymentAction(formData: FormData) {
  await requireRole("admin");
  const parsed = paymentSchema.safeParse({
    studentId: str(formData, "studentId"),
    amount: str(formData, "amount"),
    description: str(formData, "description"),
    dueDate: str(formData, "dueDate"),
    status: str(formData, "status") || "pending",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    student_id: parsed.data.studentId,
    amount: parsed.data.amount,
    description: parsed.data.description,
    due_date: parsed.data.dueDate || null,
    status: parsed.data.status,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/payments");
  return { success: "Payment recorded" };
}

export async function savePlatformSettingAction(formData: FormData) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("platform_settings").upsert({
    key: "general",
    value: {
      schoolYear: str(formData, "schoolYear"),
      supportEmail: str(formData, "supportEmail"),
    },
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: "Settings saved" };
}
