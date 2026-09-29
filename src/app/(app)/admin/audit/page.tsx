import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, created_at, actor_id")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="Audit Logs" description="Account activation and other administrative actions." />
      {!data?.length ? (
        <EmptyState title="No audit events yet." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.entity}</TableCell>
                  <TableCell className="max-w-[12rem] truncate">{row.entity_id ?? "—"}</TableCell>
                  <TableCell>{formatDate(row.created_at, true)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
