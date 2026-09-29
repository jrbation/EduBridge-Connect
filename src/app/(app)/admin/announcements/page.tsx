import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { adminCreateAnnouncementAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("announcements").select("id, title, content, audience, created_at").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Announcements" description="Broadcast school-wide notices." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!data?.length ? (
            <EmptyState title="No announcements yet" />
          ) : (
            data.map((item) => (
              <article key={item.id} className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.audience} · {formatDate(item.created_at, true)}
                </p>
              </article>
            ))
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={adminCreateAnnouncementAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <select id="audience" name="audience" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="all">
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                  <option value="teachers">Teachers</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea id="content" name="content" required />
              </div>
              <PendingButton>Post announcement</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
