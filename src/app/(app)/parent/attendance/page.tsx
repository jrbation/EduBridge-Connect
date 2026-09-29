import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function ParentAttendancePage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);
  const studentIds = links
    .filter((link) => link.status === "approved")
    .map((link) => one(link.students as { id: string } | { id: string }[] | null)?.id)
    .filter(Boolean) as string[];
  const supabase = await createClient();
  const { data } = studentIds.length
    ? await supabase
        .from("attendance")
        .select("id, date, status, remarks, classes(name), students(profiles(full_name))")
        .in("student_id", studentIds)
        .order("date", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div>
      <PageHeader title="Attendance" description="Daily attendance for your children." />
      {!data?.length ? (
        <EmptyState title="No attendance records yet." />
      ) : (
        <div className="space-y-3">
          {data.map((row) => {
            const cls = one(row.classes as { name: string } | { name: string }[] | null);
            const student = one(row.students as { profiles: { full_name: string } | { full_name: string }[] } | null);
            return (
              <div key={row.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{one(student?.profiles)?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls?.name} · {formatDate(row.date)}
                  </p>
                </div>
                <Badge variant={row.status === "absent" ? "destructive" : row.status === "late" ? "warning" : "success"}>{row.status}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
