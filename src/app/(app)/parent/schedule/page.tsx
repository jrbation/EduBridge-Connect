import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function ParentSchedulePage() {
  await requireRole("parent");
  const supabase = await createClient();
  const { data } = await supabase.from("schedules").select("*, classes(name)").order("start_time");

  return (
    <div>
      <PageHeader title="Schedule" description="Classes, live sessions, and exams." />
      {!data?.length ? (
        <EmptyState title="No scheduled events." />
      ) : (
        <div className="space-y-3">
          {data.map((event) => {
            const cls = one(event.classes as { name: string } | { name: string }[] | null);
            return (
              <div key={event.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls?.name} · {formatDate(event.start_time, true)}
                  </p>
                </div>
                <Badge>{event.type}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
