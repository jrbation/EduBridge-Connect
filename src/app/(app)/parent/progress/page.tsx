import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { SimpleBarChart } from "@/components/charts/simple-bar";
import { one } from "@/lib/utils";

export default async function ParentProgressPage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);
  const studentIds = links
    .filter((link) => link.status === "approved")
    .map((link) => one(link.students as { id: string } | { id: string }[] | null)?.id)
    .filter(Boolean) as string[];
  const supabase = await createClient();
  const { data: grades } = studentIds.length
    ? await supabase.from("grades").select("score, student_id, assignments(title, points), students(profiles(full_name))").in("student_id", studentIds)
    : { data: [] };

  const chart =
    grades?.map((grade) => {
      const assignment = one(grade.assignments as { title: string; points: number } | { title: string; points: number }[] | null);
      const student = one(grade.students as { profiles: { full_name: string } | { full_name: string }[] } | null);
      const value = assignment?.points ? Math.round((Number(grade.score) / Number(assignment.points)) * 100) : Number(grade.score);
      return { name: `${one(student?.profiles)?.full_name?.split(" ")[0] ?? "Child"} ${assignment?.title?.slice(0, 8) ?? ""}`, value };
    }) ?? [];

  return (
    <div>
      <PageHeader title="Progress" description="Grades for every linked child." />
      <div className="rounded-xl border bg-card p-5">
        {chart.length ? <SimpleBarChart data={chart} /> : <EmptyState title="No grades yet for linked children." />}
      </div>
    </div>
  );
}
