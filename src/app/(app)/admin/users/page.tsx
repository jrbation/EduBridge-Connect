import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { setAccountStatusAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminUsersPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email, role, status").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Users" description="Activate or deactivate accounts." />
      {!data?.length ? (
        <EmptyState title="No users yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "warning"}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <ActionForm action={setAccountStatusAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="status" value={user.status === "active" ? "inactive" : "active"} />
                      <PendingButton>{user.status === "active" ? "Deactivate" : "Activate"}</PendingButton>
                    </ActionForm>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
