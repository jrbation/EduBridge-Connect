import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { one } from "@/lib/utils";

export default async function AdminClassesPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, name, subject, grade_level, section, teachers(profiles(full_name))")
    .order("name");

  return (
    <div>
      <PageHeader title="Classes" description="All classes across the platform." />
      {!data?.length ? (
        <EmptyState title="No classes yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const teacher = one(row.teachers as { profiles: { full_name: string } | { full_name: string }[] } | null);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.subject}</TableCell>
                    <TableCell>
                      {row.grade_level} {row.section ?? ""}
                    </TableCell>
                    <TableCell>{one(teacher?.profiles)?.full_name ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
