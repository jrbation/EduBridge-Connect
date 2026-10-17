import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createClassAction, deleteClassAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Card, CardContent } from "@/components/ui/card";

export default async function TeacherClassesPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("*").eq("teacher_id", teacher.id)
    : { data: [] };

  return (
    <div>
      <PageHeader title="My Classes" description="Create classes, set schedules, and review enrollment." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!classes?.length ? (
            <EmptyState title="No classes yet" description="Create your first class to enroll students." />
          ) : (
            classes.map((item) => (
              <article key={item.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.subject} · Grade {item.grade_level} {item.section ? `· ${item.section}` : ""}
                    </p>
                    <p className="mt-2 text-sm">{item.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.schedule_label}
                    </p>
                  </div>
                  <ActionForm action={deleteClassAction}>
                    <input type="hidden" name="classId" value={item.id} />
                    <PendingButton variant="destructive" size="sm">Delete</PendingButton>
                  </ActionForm>
                </div>
              </article>
            ))
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createClassAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Class name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade level</Label>
                <Input id="gradeLevel" name="gradeLevel" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input id="section" name="section" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleLabel">Schedule label</Label>
                <Input id="scheduleLabel" name="scheduleLabel" placeholder="Mon/Wed 9:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <PendingButton>Create class</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
