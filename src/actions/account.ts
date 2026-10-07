"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile, requireRole } from "@/lib/auth/session";
import { linkChildSchema, messageSchema, paymentSchema } from "@/lib/validations/academic";
import { profileSchema, createAdminSchema } from "@/lib/validations/auth";
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
  const profile = await requireRole("parent");
  const parsed = linkChildSchema.safeParse({
    code: str(formData, "code"),
    relationship: str(formData, "relationship") || "guardian",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code" };
  const supabase = await createClient();
  
  // Look up student to get their profile_id for notification
  const { data: student } = await supabase
    .from("students")
    .select("id, profile_id")
    .eq("connection_code", parsed.data.code.toUpperCase())
    .maybeSingle();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.rpc("link_child_with_code" as any, {
    p_code: parsed.data.code,
    p_relationship: parsed.data.relationship,
  });
  if (error) return { error: error.message };
  
  // Notify student about the request
  if (student?.profile_id) {
    await notify(student.profile_id, "New parent connection request", `${profile.full_name} has requested to connect with your account.`, "parent");
  }
  
  // Log audit
  if (student) {
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      action: "parent_connection_requested",
      entity: "parent_student_relationships",
      metadata: { student_id: student.id, relationship: parsed.data.relationship },
    });
  }
  
  revalidatePath("/parent/children");
  return { success: "Connection request sent. The student will need to approve it." };
}

export async function approveParentLinkAction(formData: FormData) {
  const profile = await requireRole("student");
  const relationshipId = str(formData, "relationshipId");
  const supabase = await createClient();
  
  // Verify the relationship belongs to this student
  const { data: relationship } = await supabase
    .from("parent_student_relationships")
    .select("id, status, parent_id, student_id, parents(profiles(full_name))")
    .eq("id", relationshipId)
    .eq("student_id", profile.id)
    .single();
  
  if (!relationship) return { error: "Relationship not found" };
  if (relationship.status !== "pending") return { error: "This relationship is not pending approval" };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.rpc("approve_parent_link" as any, {
    p_relationship_id: relationshipId,
  });
  if (error) return { error: error.message };
  
  // Notify parent
  const parentProfile = relationship.parents as { profiles: { full_name: string } | { full_name: string }[] } | null;
  const parentName = Array.isArray(parentProfile?.profiles) ? parentProfile.profiles[0]?.full_name : parentProfile?.profiles?.full_name;
  if (relationship.parent_id) {
    await notify(relationship.parent_id, "Parent connection approved", `${parentName ?? "A parent"} has approved your connection request.`, "parent");
  }
  
  // Log audit
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "parent_connection_approved",
    entity: "parent_student_relationships",
    entity_id: relationshipId,
    metadata: { parent_id: relationship.parent_id, student_id: relationship.student_id },
  });
  
  revalidatePath("/student");
  return { success: "Parent connection approved" };
}

export async function rejectParentLinkAction(formData: FormData) {
  const profile = await requireRole("student");
  const relationshipId = str(formData, "relationshipId");
  const supabase = await createClient();
  
  // Verify the relationship belongs to this student
  const { data: relationship } = await supabase
    .from("parent_student_relationships")
    .select("id, status, parent_id, student_id, parents(profiles(full_name))")
    .eq("id", relationshipId)
    .eq("student_id", profile.id)
    .single();
  
  if (!relationship) return { error: "Relationship not found" };
  if (relationship.status !== "pending") return { error: "This relationship is not pending approval" };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.rpc("reject_parent_link" as any, {
    p_relationship_id: relationshipId,
  });
  if (error) return { error: error.message };
  
  // Notify parent
  const parentProfile = relationship.parents as { profiles: { full_name: string } | { full_name: string }[] } | null;
  const parentName = Array.isArray(parentProfile?.profiles) ? parentProfile.profiles[0]?.full_name : parentProfile?.profiles?.full_name;
  if (relationship.parent_id) {
    await notify(relationship.parent_id, "Parent connection rejected", `${parentName ?? "A parent"} rejected your connection request.`, "parent");
  }
  
  // Log audit
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    action: "parent_connection_rejected",
    entity: "parent_student_relationships",
    entity_id: relationshipId,
    metadata: { parent_id: relationship.parent_id, student_id: relationship.student_id },
  });
  
  revalidatePath("/student");
  return { success: "Parent connection request rejected" };
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

export async function createAdminAction(formData: FormData) {
  const admin = await requireRole("admin");
  const parsed = createAdminSchema.safeParse({
    fullName: str(formData, "fullName"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const adminClient = createAdminClient();

  const { data: existingUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (existingUsers.users.some((user) => user.email === parsed.data.email)) {
    return { error: "An account with this email already exists" };
  }

  const { data: userData, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, role: "student" },
  });

  if (authError || !userData.user) {
    return { error: authError?.message ?? "Failed to create admin account" };
  }

  const userId = userData.user.id;

  try {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role: "admin", full_name: parsed.data.fullName, status: "active" })
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Profile update failed: ${profileError.message}`);
    }

    const { error: deleteStudentError } = await adminClient.from("students").delete().eq("profile_id", userId);
    if (deleteStudentError) {
      console.warn("Failed to delete student record for admin:", deleteStudentError.message);
    }

    await adminClient.from("audit_logs").insert({
      actor_id: admin.id,
      action: "admin_created",
      entity: "profiles",
      entity_id: userId,
      metadata: { email: parsed.data.email, full_name: parsed.data.fullName },
    });

    revalidatePath("/admin/users");
    return { success: "Admin account created successfully" };
  } catch (error) {
    console.error("Admin creation failed, rolling back:", error);
    await adminClient.auth.admin.deleteUser(userId);
    return { error: "Failed to create admin account. Changes have been rolled back." };
  }
}
