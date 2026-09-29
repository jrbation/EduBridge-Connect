import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createPaymentAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, description, due_date, students(profiles(full_name))")
    .order("created_at", { ascending: false });
  const { data: students } = await supabase.from("students").select("id, profiles(full_name)");

  return (
    <div>
      <PageHeader title="Payments" description="Record fees and track payment status." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!payments?.length ? (
            <EmptyState title="No payments recorded." />
          ) : (
            payments.map((item) => {
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
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createPaymentAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <select id="studentId" name="studentId" className="h-10 w-full rounded-md border px-3 text-sm" required>
                  <option value="">Select</option>
                  {(students ?? []).map((student) => (
                    <option key={student.id} value={student.id}>
                      {one(student.profiles as { full_name: string } | { full_name: string }[] | null)?.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" min={1} step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="waived">Waived</option>
                </select>
              </div>
              <PendingButton>Record payment</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
