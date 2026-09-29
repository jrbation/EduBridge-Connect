import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function LiveClassesPage() {
  await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase.from("schedules").select("*, classes(name, subject)").order("start_time");

  return (
    <div>
      <PageHeader title="Live Classes" description="Join upcoming sessions or review recordings when available." />
      {!data?.length ? (
        <EmptyState title="No live classes scheduled." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((session) => {
            const cls = session.classes as { name: string; subject: string } | null;
            const upcoming = new Date(session.start_time).getTime() > Date.now();
            return (
              <article key={session.id} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{session.title}</h2>
                  <Badge>{session.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cls?.name}</p>
                <p className="mt-1 text-sm">{formatDate(session.start_time, true)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {session.meeting_url ? (
                    <Button asChild>
                      <a href={session.meeting_url} target="_blank" rel="noreferrer">
                        {upcoming ? "Join" : "Open meeting"}
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">No meeting link yet</p>
                  )}
                  {session.recording_url ? (
                    <Button variant="outline" asChild>
                      <a href={session.recording_url} target="_blank" rel="noreferrer">
                        Recording
                      </a>
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
