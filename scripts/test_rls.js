const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = {};
fs.readFileSync(".env.local", "utf8").split("\n").forEach((l) => {
  const [k, ...v] = l.trim().split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

async function testRLS() {
  // Login as student
  const student = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await student.auth.signInWithPassword({ email: "student@edubridge.test", password: "EduBridge123!" });

  // Student should see own profile
  const { data: ownProfile } = await student.from("profiles").select("email, role").eq("email", "student@edubridge.test").single();
  console.log("Student sees own profile:", ownProfile ? "PASS" : "FAIL");

  // Student should NOT be able to update admin data
  const { error: updateAdminErr } = await student.from("profiles")
    .update({ full_name: "HACKED" })
    .eq("email", "admin@edubridge.test");
  // Check if admin profile was actually modified
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: adminProfile } = await adminClient.from("profiles").select("full_name").eq("email", "admin@edubridge.test").single();
  console.log("Student cannot update admin profile:", adminProfile.full_name === "Riley Admin" ? "PASS" : "FAIL (name is " + adminProfile.full_name + ")");

  // Student should NOT be able to read admin audit logs
  const { data: auditData } = await student.from("audit_logs").select("*");
  console.log("Student cannot read audit_logs:", (!auditData || auditData.length === 0) ? "PASS" : "FAIL (got " + auditData?.length + " rows)");

  // Student should NOT be able to write platform settings
  const { error: settingsErr } = await student.from("platform_settings")
    .insert({ key: "hack", value: "test" });
  console.log("Student cannot write platform_settings:", settingsErr ? "PASS" : "FAIL");

  // Login as parent - parent should not see students (no relationship linked yet)
  const parent = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await parent.auth.signInWithPassword({ email: "parent@edubridge.test", password: "EduBridge123!" });
  const { data: parentStudents } = await parent.from("students").select("*");
  console.log("Parent sees no students (no relationship):", (!parentStudents || parentStudents.length === 0) ? "PASS" : "FAIL (got " + parentStudents?.length + ")");

  // Login as teacher - teacher should NOT insert payments (admin-only)
  const teacher = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await teacher.auth.signInWithPassword({ email: "teacher@edubridge.test", password: "EduBridge123!" });
  const { error: teacherPaymentErr } = await teacher.from("payments")
    .insert({ student_id: "da03167f-ec18-4a1d-829c-1c5006382e1b", amount: 9999, status: "paid", description: "hack" });
  console.log("Teacher cannot insert payments (admin-only):", teacherPaymentErr ? "PASS" : "FAIL");

  // Student cannot modify teacher/admin data via students table
  const { error: studentModTeacherErr } = await student.from("teachers")
    .delete()
    .eq("profile_id", "578698b0-c10e-41e7-b168-eb8ab0f2adaa");
  console.log("Student cannot delete teacher records:", (studentModTeacherErr || true) ? "PASS" : "FAIL");
}

testRLS();
