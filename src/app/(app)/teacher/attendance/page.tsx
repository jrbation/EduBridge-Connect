import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { one } from "@/lib/utils";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const { classId } = await searchParams;
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const selectedId = classId || classes?.[0]?.id;
  const { data: roster } = selectedId
    ? await supabase
        .from("class_students")
        .select("student_id, students(id, profiles(full_name))")
        .eq("class_id", selectedId)
    : { data: [] };

  const students =
    roster?.map((row) => {
      const student = one(row.students as { id: string; profiles: { full_name: string } | { full_name: string }[] } | null);
      return { id: row.student_id, name: one(student?.profiles)?.full_name ?? "Student" };
    }) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Attendance" description="Mark present, late, absent, or excused for a class session." />
      {!classes?.length ? (
        <EmptyState title="Create a class before taking attendance." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/attendance?classId=${cls.id}`}
                className={`rounded-full border px-3 py-1 text-sm ${selectedId === cls.id ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                {cls.name}
              </Link>
            ))}
          </div>
          {!students.length ? (
            <EmptyState title="No students in this class." />
          ) : (
            <div className="rounded-xl border bg-card p-5">
              <AttendanceForm classId={selectedId!} students={students} defaultDate={today} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
