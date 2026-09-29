import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { one } from "@/lib/utils";

export default async function AdminStudentsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_number, grade_level, section, connection_code, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Students" description="Directory of student records and connection codes." />
      {!data?.length ? (
        <EmptyState title="No students yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const person = one(row.profiles as { full_name: string; email: string } | { full_name: string; email: string }[] | null);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{person?.full_name}</TableCell>
                    <TableCell>{person?.email}</TableCell>
                    <TableCell>{row.student_number ?? "—"}</TableCell>
                    <TableCell>
                      {row.grade_level ?? "—"} {row.section ?? ""}
                    </TableCell>
                    <TableCell>{row.connection_code}</TableCell>
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
