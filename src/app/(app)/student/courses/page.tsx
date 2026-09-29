import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { toggleFavoriteAction } from "@/actions/academic";
import { PendingButton } from "@/components/forms/pending-button";

export default async function StudentCoursesPage() {
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, status, class_id")
    .eq("status", "published");
  const { data: favorites } = student
    ? await supabase.from("course_favorites").select("course_id").eq("student_id", student.id)
    : { data: [] };
  const favoriteIds = new Set((favorites ?? []).map((row) => row.course_id));

  return (
    <div>
      <PageHeader title="My Courses" description="Open a course to continue lessons and track completion." />
      {!courses?.length ? (
        <EmptyState title="You are not enrolled in any courses yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{course.title}</h2>
                <Badge variant={favoriteIds.has(course.id) ? "default" : "outline"}>
                  {favoriteIds.has(course.id) ? "Favorite" : "Course"}
                </Badge>
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{course.description}</p>
              <div className="mt-4 flex gap-2">
                <Link className="text-sm font-medium text-primary hover:underline" href={`/student/courses/${course.id}`}>
                  Continue learning
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await toggleFavoriteAction(course.id);
                  }}
                >
                  <PendingButton>{favoriteIds.has(course.id) ? "Unfavorite" : "Favorite"}</PendingButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
