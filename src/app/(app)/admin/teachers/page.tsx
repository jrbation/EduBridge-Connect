import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { one } from "@/lib/utils";

export default async function AdminTeachersPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("id, employee_number, bio, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Teachers" description="Faculty accounts and employee numbers." />
      {!data?.length ? (
        <EmptyState title="No teachers yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee #</TableHead>
                <TableHead>Bio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const person = one(row.profiles as { full_name: string; email: string } | { full_name: string; email: string }[] | null);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{person?.full_name}</TableCell>
                    <TableCell>{person?.email}</TableCell>
                    <TableCell>{row.employee_number ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.bio ?? "—"}</TableCell>
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
