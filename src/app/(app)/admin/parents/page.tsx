import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { one } from "@/lib/utils";

export default async function AdminParentsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("parents").select("id, created_at, profiles(full_name, email)").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Parents" description="Guardian accounts registered on the platform." />
      {!data?.length ? (
        <EmptyState title="No parents yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const person = one(row.profiles as { full_name: string; email: string } | { full_name: string; email: string }[] | null);
                return (
                  <TableRow key={row.id}>
                    <TableCell>{person?.full_name}</TableCell>
                    <TableCell>{person?.email}</TableCell>
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
