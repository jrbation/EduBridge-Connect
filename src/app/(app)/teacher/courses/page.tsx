import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createCourseAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Badge } from "@/components/ui/badge";
import { one } from "@/lib/utils";

export default async function TeacherCoursesPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: courses } = teacher
    ? await supabase.from("courses").select("*, classes(name)").eq("teacher_id", teacher.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <PageHeader title="Courses" description="Publish course shells that students can open from their portal." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!courses?.length ? (
            <EmptyState title="No courses yet" />
          ) : (
            courses.map((course) => {
              const cls = one(course.classes as { name: string } | { name: string }[] | null);
              return (
                <article key={course.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{course.title}</h2>
                      <p className="text-sm text-muted-foreground">{cls?.name ?? "Unassigned class"}</p>
                    </div>
                    <Badge>{course.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{course.description}</p>
                </article>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createCourseAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <select id="classId" name="classId" className="h-10 w-full rounded-md border px-3 text-sm">
                  <option value="">None</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <PendingButton>Create course</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
