import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { formatDate, one } from "@/lib/utils";

export default async function ParentAssignmentsPage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);
  const studentIds = links
    .filter((link) => link.status === "approved")
    .map((link) => one(link.students as { id: string } | { id: string }[] | null)?.id)
    .filter(Boolean) as string[];
  const supabase = await createClient();
  const { data: enrollments } = studentIds.length
    ? await supabase.from("class_students").select("class_id").in("student_id", studentIds)
    : { data: [] };
  const classIds = [...new Set((enrollments ?? []).map((row) => row.class_id))];
  const { data: assignments } = classIds.length
    ? await supabase.from("assignments").select("id, title, due_date, classes(name)").in("class_id", classIds).order("due_date")
    : { data: [] };

  return (
    <div>
      <PageHeader title="Assignments" description="Upcoming work for your children." />
      {!assignments?.length ? (
        <EmptyState title="No assignments for linked children." />
      ) : (
        <div className="space-y-3">
          {assignments.map((item) => {
            const cls = one(item.classes as { name: string } | { name: string }[] | null);
            return (
              <article key={item.id} className="rounded-xl border bg-card p-4">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {cls?.name} · due {formatDate(item.due_date)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
