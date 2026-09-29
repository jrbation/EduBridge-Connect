import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createAssignmentAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { formatDate, one } from "@/lib/utils";

export default async function TeacherAssignmentsPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, due_date, points, classes(name, teacher_id)")
    .eq("created_by", profile.id)
    .order("due_date");

  return (
    <div>
      <PageHeader title="Assignments" description="Publish work to a class. Students are notified automatically." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!assignments?.length ? (
            <EmptyState title="No assignments yet" />
          ) : (
            assignments.map((item) => {
              const cls = one(item.classes as { name: string } | { name: string }[] | null);
              return (
                <article key={item.id} className="rounded-xl border bg-card p-5">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {cls?.name} · {item.points} pts · due {formatDate(item.due_date)}
                  </p>
                </article>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createAssignmentAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <select id="classId" name="classId" className="h-10 w-full rounded-md border px-3 text-sm" required>
                  <option value="">Select</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input id="points" name="points" type="number" min={1} defaultValue={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Instructions</Label>
                <Textarea id="description" name="description" />
              </div>
              <PendingButton>Publish assignment</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
