import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createLessonAction, createResourceAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { one } from "@/lib/utils";

export default async function TeacherLessonsPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: courses } = teacher
    ? await supabase.from("courses").select("id, title").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: lessons } = teacher
    ? await supabase.from("lessons").select("*, courses(title, teacher_id)").order("created_at", { ascending: false }).limit(40)
    : { data: [] };
  const { data: resources } = teacher
    ? await supabase.from("resources").select("*").eq("teacher_id", teacher.id).order("created_at", { ascending: false }).limit(20)
    : { data: [] };

  const mine = (lessons ?? []).filter((lesson) => {
    const course = one(lesson.courses as { teacher_id: string } | { teacher_id: string }[] | null);
    return course?.teacher_id === teacher?.id;
  });

  return (
    <div>
      <PageHeader title="Lessons" description="Add lesson content and supporting study resources." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="font-semibold">Lessons</h2>
            {!mine.length ? (
              <EmptyState title="No lessons yet" />
            ) : (
              mine.map((lesson) => {
                const course = one(lesson.courses as { title: string } | { title: string }[] | null);
                return (
                  <article key={lesson.id} className="rounded-xl border bg-card p-5">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground">{course?.title}</p>
                    <p className="mt-2 text-sm">{lesson.description}</p>
                  </article>
                );
              })
            )}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Resources</h2>
            {!resources?.length ? (
              <EmptyState title="No resources yet" />
            ) : (
              resources.map((item) => (
                <article key={item.id} className="rounded-xl border bg-card p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.type} {item.file_url ? `· ${item.file_url}` : ""}
                  </p>
                </article>
              ))
            )}
          </section>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createLessonAction} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <select id="courseId" name="courseId" className="h-10 w-full rounded-md border px-3 text-sm" required>
                    <option value="">Select</option>
                    {(courses ?? []).map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input id="videoUrl" name="videoUrl" />
                </div>
                <PendingButton>Create lesson</PendingButton>
              </ActionForm>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add resource</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm action={createResourceAction} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="resourceTitle">Title</Label>
                  <Input id="resourceTitle" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceClass">Class</Label>
                  <select id="resourceClass" name="classId" className="h-10 w-full rounded-md border px-3 text-sm">
                    <option value="">None</option>
                    {(classes ?? []).map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select id="type" name="type" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="pdf">
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="notes">Notes</option>
                    <option value="link">Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">File or link URL</Label>
                  <Input id="fileUrl" name="fileUrl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceDescription">Description</Label>
                  <Textarea id="resourceDescription" name="description" />
                </div>
                <PendingButton>Add resource</PendingButton>
              </ActionForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
