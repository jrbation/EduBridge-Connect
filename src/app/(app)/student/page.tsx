import Link from "next/link";
import { BookOpen, Calendar, ClipboardCheck, Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord, firstName, getPendingParentRequests } from "@/lib/data/records";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { formatDate, percent } from "@/lib/utils";
import { PendingParentRequests } from "@/components/student/pending-parent-requests";

export default async function StudentDashboardPage() {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  if (!student) {
    return <EmptyState title="Student profile is incomplete" description="Ask an administrator to finish setup." />;
  }

  const [{ data: enrollments }, { data: assignments }, { data: grades }, { data: attendance }, { data: schedules }, { data: announcements }, pendingRequests] =
    await Promise.all([
      supabase.from("class_students").select("class_id, classes(id, name, subject)").eq("student_id", student.id),
      supabase.from("assignments").select("id, title, due_date, class_id").order("due_date", { ascending: true }).limit(8),
      supabase.from("grades").select("score, assignment_id, assignments(title, points)").eq("student_id", student.id),
      supabase.from("attendance").select("status").eq("student_id", student.id),
      supabase.from("schedules").select("id, title, start_time, type").gte("start_time", new Date().toISOString()).order("start_time").limit(5),
      supabase.from("announcements").select("id, title, created_at").order("created_at", { ascending: false }).limit(4),
      getPendingParentRequests(profile.id),
    ]);

  const present = attendance?.filter((row) => row.status === "present" || row.status === "late").length ?? 0;
  const attendancePct = percent(present, attendance?.length ?? 0);
  const avg =
    grades?.length
      ? Math.round(
          grades.reduce((sum, grade) => {
            const assignment = grade.assignments as { points: number } | { points: number }[] | null;
            const points = Array.isArray(assignment) ? assignment[0]?.points : assignment?.points;
            return sum + (points ? (Number(grade.score) / Number(points)) * 100 : Number(grade.score));
          }, 0) / grades.length,
        )
      : 0;

  return (
    <div>
      <PageHeader title={`Welcome back, ${firstName(profile)}`} description="Here is a snapshot of your learning this week." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Courses" value={enrollments?.length ?? 0} icon={BookOpen} />
        <StatCard title="Upcoming classes" value={schedules?.length ?? 0} icon={Calendar} />
        <StatCard title="Average grade" value={`${avg}%`} icon={ClipboardCheck} />
        <StatCard title="Attendance" value={`${attendancePct}%`} icon={Megaphone} />
      </div>
      <p className="mt-4 rounded-xl border bg-card px-4 py-3 text-sm">
        Parent connection code: <span className="font-semibold">{student.connection_code}</span>
      </p>
      <PendingParentRequests requests={pendingRequests} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Current courses</h2>
            <Link className="text-sm text-primary hover:underline" href="/student/courses">
              View all
            </Link>
          </div>
          {!enrollments?.length ? (
            <EmptyState title="You are not enrolled in any courses yet." />
          ) : (
            <ul className="space-y-2">
              {enrollments.map((row) => {
                const cls = row.classes as { id: string; name: string; subject: string } | null;
                return (
                  <li key={row.class_id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span>
                      <span className="block font-medium">{cls?.name}</span>
                      <span className="text-sm text-muted-foreground">{cls?.subject}</span>
                    </span>
                    <Badge variant="secondary">Enrolled</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold">Pending assignments</h2>
          {!assignments?.length ? (
            <EmptyState title="No assignments yet" />
          ) : (
            <ul className="space-y-2">
              {assignments.map((item) => (
                <li key={item.id}>
                  <Link href={`/student/assignments/${item.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(item.due_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold">Overall progress</h2>
          <p className="mb-2 text-sm text-muted-foreground">Based on graded work so far.</p>
          <Progress value={avg} />
        </section>
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-semibold">Announcements</h2>
          {!announcements?.length ? (
            <EmptyState title="No announcements yet." />
          ) : (
            <ul className="space-y-2">
              {announcements.map((item) => (
                <li key={item.id} className="rounded-lg border px-3 py-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
