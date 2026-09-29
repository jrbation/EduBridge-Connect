import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";

export default async function StudentResourcesPage() {
  await requireRole("student");
  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Study Resources" description="PDFs, videos, notes, and reference materials from your teachers." />
      {!data?.length ? (
        <EmptyState title="No study resources yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((resource) => (
            <article key={resource.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{resource.title}</h2>
                <Badge variant="secondary">{resource.type}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
              {resource.file_url ? (
                <a className="mt-3 inline-block text-sm text-primary hover:underline" href={resource.file_url} target="_blank" rel="noreferrer">
                  Open resource
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">File attached in class materials.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
