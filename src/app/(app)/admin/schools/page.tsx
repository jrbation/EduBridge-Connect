import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createSchoolAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export default async function AdminSchoolsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("schools").select("*").order("name");

  return (
    <div>
      <PageHeader title="Schools" description="Create and review school campuses." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!data?.length ? (
            <EmptyState title="No schools yet" />
          ) : (
            data.map((school) => (
              <article key={school.id} className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">{school.name}</h2>
                <p className="text-sm text-muted-foreground">{school.address ?? "No address"}</p>
              </article>
            ))
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createSchoolAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">School name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
              <PendingButton>Create school</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
