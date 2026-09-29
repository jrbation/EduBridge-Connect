import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createAnnouncementAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { formatDate } from "@/lib/utils";

export default async function TeacherAnnouncementsPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, content, audience, created_at")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Announcements" description="Post updates to students, parents, or everyone." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!announcements?.length ? (
            <EmptyState title="No announcements yet" />
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.audience} · {formatDate(item.created_at, true)}
                </p>
              </article>
            ))
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createAnnouncementAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <select id="audience" name="audience" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="students">
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                  <option value="teachers">Teachers</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class (optional)</Label>
                <select id="classId" name="classId" className="h-10 w-full rounded-md border px-3 text-sm">
                  <option value="">School-wide</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea id="content" name="content" required />
              </div>
              <PendingButton>Post announcement</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
