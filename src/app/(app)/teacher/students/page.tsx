import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { enrollStudentAction, removeStudentAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { one } from "@/lib/utils";

export default async function TeacherStudentsPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase
        .from("classes")
        .select("id, name, class_students(student_id, students(id, student_number, profiles(full_name, email)))")
        .eq("teacher_id", teacher.id)
    : { data: [] };

  return (
    <div>
      <PageHeader title="Students" description="Enroll students in your classes using their student number." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {!classes?.length ? (
            <EmptyState title="Create a class first" description="Students appear here after you enroll them." />
          ) : (
            classes.map((cls) => {
              const roster = (cls.class_students as { student_id: string; students: unknown }[] | null) ?? [];
              return (
                <section key={cls.id} className="rounded-xl border bg-card p-5">
                  <h2 className="mb-3 font-semibold">{cls.name}</h2>
                  {!roster.length ? (
                    <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {roster.map((row) => {
                        const student = one(
                          row.students as
                            | { id: string; student_number: string | null; profiles: { full_name: string; email: string } | { full_name: string; email: string }[] }
                            | null,
                        );
                        const person = one(student?.profiles);
                        return (
                          <li key={row.student_id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                            <span>
                              <span className="block font-medium">{person?.full_name ?? "Student"}</span>
                              <span className="text-muted-foreground">
                                {student?.student_number ?? "No number"} · {person?.email}
                              </span>
                            </span>
                            <ActionForm action={removeStudentAction}>
                              <input type="hidden" name="classId" value={cls.id} />
                              <input type="hidden" name="studentId" value={row.student_id} />
                              <PendingButton>Remove</PendingButton>
                            </ActionForm>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={enrollStudentAction} className="space-y-3">
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
                <Label htmlFor="studentNumber">Student number</Label>
                <Input id="studentNumber" name="studentNumber" required />
              </div>
              <PendingButton>Enroll student</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
