import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getParentChildren } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function ParentPaymentsPage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);
  const studentIds = links
    .filter((link) => link.status === "approved")
    .map((link) => one(link.students as { id: string } | { id: string }[] | null)?.id)
    .filter(Boolean) as string[];
  const supabase = await createClient();
  const { data } = studentIds.length
    ? await supabase
        .from("payments")
        .select("id, amount, status, description, due_date, students(profiles(full_name))")
        .in("student_id", studentIds)
        .order("due_date")
    : { data: [] };

  return (
    <div>
      <PageHeader title="Payments & Fees" description="Fees posted by the school for your children." />
      {!data?.length ? (
        <EmptyState title="No fees posted yet." />
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const student = one(item.students as { profiles: { full_name: string } | { full_name: string }[] } | null);
            return (
              <article key={item.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {one(student?.profiles)?.full_name} · due {formatDate(item.due_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">${Number(item.amount).toFixed(2)}</p>
                  <Badge variant={item.status === "paid" ? "success" : item.status === "overdue" ? "destructive" : "warning"}>{item.status}</Badge>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
