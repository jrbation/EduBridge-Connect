import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { completeLessonAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Progress } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { PendingButton } from "@/components/forms/pending-button";
import { percent } from "@/lib/utils";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
  if (!course) notFound();
  const { data: lessons } = await supabase.from("lessons").select("*").eq("course_id", id).order("sort_order");
  const { data: progress } = student
    ? await supabase.from("lesson_progress").select("lesson_id").eq("student_id", student.id)
    : { data: [] };
  const done = new Set((progress ?? []).map((row) => row.lesson_id));
  const completion = percent(done.size, lessons?.length ?? 0);

  return (
    <div>
      <PageHeader title={course.title} description={course.description ?? "Course materials and lessons"} />
      <div className="mb-6">
        <p className="mb-2 text-sm text-muted-foreground">Completion {completion}%</p>
        <Progress value={completion} />
      </div>
      {!lessons?.length ? (
        <EmptyState title="No lessons yet" />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <article key={lesson.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{lesson.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>
                </div>
                <Badge variant={done.has(lesson.id) ? "success" : "secondary"}>
                  {done.has(lesson.id) ? "Completed" : "In progress"}
                </Badge>
              </div>
              {lesson.content ? <p className="mt-3 whitespace-pre-wrap text-sm">{lesson.content}</p> : null}
              {lesson.video_url ? (
                <a className="mt-2 inline-block text-sm text-primary hover:underline" href={lesson.video_url} target="_blank" rel="noreferrer">
                  Open video
                </a>
              ) : null}
              {!done.has(lesson.id) ? (
                <form
                  className="mt-4"
                  action={async () => {
                    "use server";
                    await completeLessonAction(lesson.id);
                  }}
                >
                  <PendingButton>Mark complete</PendingButton>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
