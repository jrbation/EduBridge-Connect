import { requireRole } from "@/lib/auth/session";
import { getParentChildren } from "@/lib/data/records";
import { linkChildAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Badge } from "@/components/ui/badge";
import { one } from "@/lib/utils";

export default async function ParentChildrenPage() {
  const profile = await requireRole("parent");
  const links = await getParentChildren(profile.id);

  return (
    <div>
      <PageHeader title="My Children" description="Link a student with the connection code from their profile." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!links.length ? (
            <EmptyState title="No linked students yet" />
          ) : (
            links.map((link) => {
              const student = one(
                link.students as
                  | {
                      student_number: string | null;
                      grade_level: string | null;
                      section: string | null;
                      profiles: { full_name: string; email: string } | { full_name: string; email: string }[];
                    }
                  | null,
              );
              const person = one(student?.profiles);
              return (
                <article key={link.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{person?.full_name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {student?.student_number ?? "No number"} · Grade {student?.grade_level ?? "—"} {student?.section ?? ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{person?.email}</p>
                    </div>
                    <Badge variant={link.status === "approved" ? "success" : link.status === "pending" ? "warning" : "destructive"}>{link.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Relationship: {link.relationship}
                    {link.status === "pending" && " · Waiting for student approval"}
                    {link.status === "rejected" && " · Request was rejected"}
                  </p>
                </article>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={linkChildAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="code">Connection code</Label>
                <Input id="code" name="code" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <Input id="relationship" name="relationship" defaultValue="guardian" />
              </div>
              <PendingButton>Link child</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
