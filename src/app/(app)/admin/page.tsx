import { Building2, CreditCard, GraduationCap, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstName } from "@/lib/data/records";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/states";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [{ count: users }, { count: students }, { count: schools }, { count: payments }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id", { count: "exact", head: true }).in("status", ["pending", "overdue"]),
    supabase.from("audit_logs").select("id, action, entity, created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  return (
    <div>
      <PageHeader title={`Admin, ${firstName(profile)}`} description="Users, schools, and platform activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users" value={users ?? 0} icon={Users} />
        <StatCard title="Students" value={students ?? 0} icon={GraduationCap} />
        <StatCard title="Schools" value={schools ?? 0} icon={Building2} />
        <StatCard title="Open fees" value={payments ?? 0} icon={CreditCard} />
      </div>
      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-semibold">Recent audit activity</h2>
        {!logs?.length ? (
          <EmptyState title="No audit logs yet." />
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.map((log) => (
              <li key={log.id} className="rounded-lg border px-3 py-2">
                {log.action} · {log.entity} · {formatDate(log.created_at, true)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
