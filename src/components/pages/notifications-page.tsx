import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { markNotificationsReadAction } from "@/actions/account";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Assignment, grade, message, and schedule updates."
        actions={
          <ActionForm action={markNotificationsReadAction}>
            <PendingButton>Mark all read</PendingButton>
          </ActionForm>
        }
      />
      {!data?.length ? (
        <EmptyState title="No notifications yet." description="You will see updates here as activity happens." />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="rounded-xl border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                </div>
                <Badge variant={item.read_at ? "secondary" : "default"}>{item.read_at ? "Read" : "New"}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at, true)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
