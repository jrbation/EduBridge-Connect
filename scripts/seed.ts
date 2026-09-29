import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_PASSWORD = "EduBridge123!";

const demos = [
  { email: "student@edubridge.test", full_name: "Ava Student", role: "student" },
  { email: "parent@edubridge.test", full_name: "Jordan Parent", role: "parent" },
  { email: "teacher@edubridge.test", full_name: "Morgan Teacher", role: "teacher" },
  { email: "admin@edubridge.test", full_name: "Riley Admin", role: "admin" },
] as const;

async function upsertUser(email: string, full_name: string, role: (typeof demos)[number]["role"]) {
  const metadataRole = role === "admin" ? "student" : role;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name, role: metadataRole },
  });

  let userId = data.user?.id;
  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = list.users.find((user) => user.email === email);
    if (!existing) {
      throw new Error(error.message);
    }
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name, role: metadataRole },
    });
  }

  if (!userId) throw new Error(`Could not provision ${email}`);

  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin", full_name, status: "active" }).eq("id", userId);
    await admin.from("students").delete().eq("profile_id", userId);
  } else {
    await admin.from("profiles").update({ full_name, status: "active" }).eq("id", userId);
  }
}

async function main() {
  for (const demo of demos) {
    await upsertUser(demo.email, demo.full_name, demo.role);
    console.log(`Ready: ${demo.email}`);
  }
  console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
