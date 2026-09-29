import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/states";
import { SimpleBarChart } from "@/components/charts/simple-bar";

export default async function AdminReportsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ count: students }, { count: teachers }, { count: parents }, { count: classes }] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("parents").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <PageHeader title="Reports" description="Enrollment snapshot by role." />
      <div className="rounded-xl border bg-card p-5">
        <SimpleBarChart
          data={[
            { name: "Students", value: students ?? 0 },
            { name: "Teachers", value: teachers ?? 0 },
            { name: "Parents", value: parents ?? 0 },
            { name: "Classes", value: classes ?? 0 },
          ]}
        />
      </div>
    </div>
  );
}
