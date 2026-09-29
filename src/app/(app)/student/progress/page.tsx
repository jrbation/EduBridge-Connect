import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { SimpleBarChart } from "@/components/charts/simple-bar";
import { Progress } from "@/components/ui/misc";
import { percent } from "@/lib/utils";

export default async function StudentProgressPage() {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: grades } = student
    ? await supabase.from("grades").select("score, assignments(title, points)").eq("student_id", student.id)
    : { data: [] };
  const { data: attendance } = student
    ? await supabase.from("attendance").select("status").eq("student_id", student.id)
    : { data: [] };
  const { count: lessonCount } = await supabase.from("lessons").select("id", { count: "exact", head: true });
  const { count: completedCount } = student
    ? await supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("student_id", student.id)
    : { count: 0 };

  const chart =
    grades?.map((grade) => {
      const assignment = grade.assignments as { title: string; points: number } | null;
      const value = assignment?.points ? Math.round((Number(grade.score) / Number(assignment.points)) * 100) : Number(grade.score);
      return { name: assignment?.title?.slice(0, 12) ?? "Work", value };
    }) ?? [];
  const present = attendance?.filter((row) => row.status === "present" || row.status === "late").length ?? 0;
  const low = chart.filter((item) => item.value < 70);

  return (
    <div>
      <PageHeader title="Progress & Grades" description="Course completion, scores, attendance, and areas to improve." />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Lesson completion</p>
          <p className="mt-2 text-2xl font-semibold">{percent(completedCount ?? 0, lessonCount ?? 0)}%</p>
          <Progress className="mt-3" value={percent(completedCount ?? 0, lessonCount ?? 0)} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Attendance</p>
          <p className="mt-2 text-2xl font-semibold">{percent(present, attendance?.length ?? 0)}%</p>
          <Progress className="mt-3" value={percent(present, attendance?.length ?? 0)} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Strengths</p>
          <p className="mt-2 text-sm">{chart.filter((item) => item.value >= 85).map((item) => item.name).join(", ") || "Keep practicing across subjects."}</p>
        </div>
      </div>
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Assignment performance</h2>
        {chart.length ? <SimpleBarChart data={chart} /> : <EmptyState title="No grades yet" />}
      </div>
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="mb-2 font-semibold">Areas needing improvement</h2>
        {low.length ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {low.map((item) => (
              <li key={item.name}>
                {item.name}: {item.value}%
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No weak areas flagged yet.</p>
        )}
      </div>
    </div>
  );
}
