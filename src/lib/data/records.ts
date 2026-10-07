import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getStudentRecord(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("students").select("*").eq("profile_id", profileId).maybeSingle();
  return data;
}

export async function getTeacherRecord(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("teachers").select("*").eq("profile_id", profileId).maybeSingle();
  return data;
}

export async function getParentRecord(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("parents").select("*").eq("profile_id", profileId).maybeSingle();
  return data;
}

export async function unreadCount(profileId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profileId)
    .is("read_at", null);
  return count ?? 0;
}

export async function notify(userId: string, title: string, message: string, type: string) {
  const supabase = await createClient();
  await supabase.rpc("notify_user", {
    p_user_id: userId,
    p_title: title,
    p_message: message,
    p_type: type,
  });
}

export function firstName(profile: Profile) {
  return profile.full_name.split(" ")[0] ?? profile.full_name;
}

export async function getParentChildren(profileId: string) {
  const parent = await getParentRecord(profileId);
  if (!parent) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("parent_student_relationships")
    .select(
      "id, relationship, status, students(id, student_number, grade_level, section, connection_code, profile_id, profiles(full_name, email))",
    )
    .eq("parent_id", parent.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPendingParentRequests(studentId: string) {
  const student = await getStudentRecord(studentId);
  if (!student) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("parent_student_relationships")
    .select("id, parent_id, relationship, status, parents(profiles(full_name, email))")
    .eq("student_id", student.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}
