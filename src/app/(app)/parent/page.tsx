import { Users, Calendar, ClipboardCheck, CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { firstName, getParentChildren } from "@/lib/data/records";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/states";
import { formatDate, one } from "@/lib/utils";

export default async function ParentDashboardPage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);
  const children = links
    .filter((link) => link.status === "approved")
    .map((link) => one(link.students as { id: string; profiles: { full_name: string } | { full_name: string }[] } | null))
    .filter(Boolean) as { id: string; profiles: { full_name: string } | { full_name: string }[] }[];
  const studentIds = children.map((child) => child.id);
  const supabase = await createClient();
  const [{ data: payments }, { data: announcements }, { data: schedules }] = await Promise.all([
    studentIds.length
      ? supabase.from("payments").select("id, amount, status, description").in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
    supabase.from("announcements").select("id, title, created_at").in("audience", ["all", "parents"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("schedules").select("title, start_time").gte("start_time", new Date().toISOString()).order("start_time").limit(5),
  ]);
  const unpaid = payments?.filter((item) => item.status === "pending" || item.status === "overdue") ?? [];

  return (
    <div>
      <PageHeader title={`Hello, ${firstName(profile)}`} description="Follow your children's classes, grades, and fees." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Children" value={children.length} icon={Users} />
        <StatCard title="Upcoming sessions" value={schedules?.length ?? 0} icon={Calendar} />
        <StatCard title="Open fees" value={unpaid.length} icon={CreditCard} />
        <StatCard title="Announcements" value={announcements?.length ?? 0} icon={ClipboardCheck} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Linked children</h2>
          {!children.length ? (
            <EmptyState title="No children linked yet" description="Use the connection code from the student profile." />
          ) : (
            <ul className="space-y-2 text-sm">
              {children.map((child) => (
                <li key={child.id} className="rounded-lg border px-3 py-2">
                  {one(child.profiles)?.full_name}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">School updates</h2>
          {!announcements?.length ? (
            <EmptyState title="No announcements yet." />
          ) : (
            <ul className="space-y-2 text-sm">
              {announcements.map((item) => (
                <li key={item.id} className="rounded-lg border px-3 py-2">
                  {item.title} · {formatDate(item.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
