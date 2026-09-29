import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { one } from "@/lib/utils";

export default async function AdminCoursesPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("id, title, status, teachers(profiles(full_name))").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Courses" description="Published and draft courses." />
      {!data?.length ? (
        <EmptyState title="No courses yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const teacher = one(row.teachers as { profiles: { full_name: string } | { full_name: string }[] } | null);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{one(teacher?.profiles)?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge>{row.status}</Badge>
                    </TableCell>
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
