import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { formatDate } from "@/lib/utils";

export default async function ParentAnnouncementsPage() {
  await requireRole("parent");
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, content, audience, created_at")
    .in("audience", ["all", "parents"])
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Announcements" description="School and class notices for families." />
      {!data?.length ? (
        <EmptyState title="No announcements yet." />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <article key={item.id} className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm">{item.content}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.created_at, true)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
