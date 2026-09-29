import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { PageHeader } from "@/components/shared/states";
import { SimpleBarChart } from "@/components/charts/simple-bar";
import { percent } from "@/lib/utils";

export default async function TeacherReportsPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const classIds = (classes ?? []).map((item) => item.id);
  const { data: grades } = await supabase.from("grades").select("score, assignments(points, class_id, title)");
  const { data: attendance } = classIds.length
    ? await supabase.from("attendance").select("status, class_id").in("class_id", classIds)
    : { data: [] };

  const chart =
    (classes ?? []).map((cls) => {
      const classGrades = (grades ?? []).filter((grade) => {
        const assignment = grade.assignments as { class_id: string; points: number } | { class_id: string; points: number }[] | null;
        const meta = Array.isArray(assignment) ? assignment[0] : assignment;
        return meta?.class_id === cls.id;
      });
      const avg = classGrades.length
        ? Math.round(
            classGrades.reduce((sum, grade) => {
              const assignment = grade.assignments as { points: number } | { points: number }[] | null;
              const points = Array.isArray(assignment) ? assignment[0]?.points : assignment?.points;
              return sum + (points ? (Number(grade.score) / Number(points)) * 100 : Number(grade.score));
            }, 0) / classGrades.length,
          )
        : 0;
      return { name: cls.name.slice(0, 12), value: avg };
    }) ?? [];

  const present = attendance?.filter((row) => row.status === "present" || row.status === "late").length ?? 0;

  return (
    <div>
      <PageHeader title="Reports" description="Class averages and attendance snapshot." />
      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Overall attendance</p>
        <p className="mt-2 text-2xl font-semibold">{percent(present, attendance?.length ?? 0)}%</p>
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Average grade by class</h2>
        <SimpleBarChart data={chart} />
      </div>
    </div>
  );
}
