import { BookOpen, ClipboardCheck, Users, Calendar } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord, firstName } from "@/lib/data/records";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/states";
import { formatDate } from "@/lib/utils";

export default async function TeacherDashboardPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const classIds = (classes ?? []).map((item) => item.id);
  const [{ count: studentCount }, { count: pending }, { data: submissions }, { data: upcoming }] = await Promise.all([
    classIds.length
      ? supabase.from("class_students").select("student_id", { count: "exact", head: true }).in("class_id", classIds)
      : Promise.resolve({ count: 0 }),
    supabase.from("assignment_submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("assignment_submissions").select("id, submitted_at, assignments(title), students(profiles(full_name))").eq("status", "submitted").limit(5),
    supabase.from("schedules").select("title, start_time").gte("start_time", new Date().toISOString()).order("start_time").limit(5),
  ]);

  return (
    <div>
      <PageHeader title={`Hello, ${firstName(profile)}`} description="Class activity, grading, and upcoming sessions." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Classes" value={classes?.length ?? 0} icon={BookOpen} />
        <StatCard title="Students" value={studentCount ?? 0} icon={Users} />
        <StatCard title="Pending grading" value={pending ?? 0} icon={ClipboardCheck} />
        <StatCard title="Upcoming sessions" value={upcoming?.length ?? 0} icon={Calendar} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Recent submissions</h2>
          {!submissions?.length ? (
            <EmptyState title="No submissions waiting." />
          ) : (
            <ul className="space-y-2 text-sm">
              {submissions.map((row) => {
                const assignment = row.assignments as { title: string } | null;
                const student = row.students as { profiles: { full_name: string } | { full_name: string }[] } | null;
                const name = Array.isArray(student?.profiles) ? student?.profiles[0]?.full_name : student?.profiles?.full_name;
                return (
                  <li key={row.id} className="rounded-lg border px-3 py-2">
                    {name} · {assignment?.title} · {formatDate(row.submitted_at, true)}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Upcoming classes</h2>
          {!upcoming?.length ? (
            <EmptyState title="No upcoming classes." />
          ) : (
            <ul className="space-y-2 text-sm">
              {upcoming.map((item, index) => (
                <li key={`${item.title}-${index}`} className="rounded-lg border px-3 py-2">
                  {item.title} · {formatDate(item.start_time, true)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
