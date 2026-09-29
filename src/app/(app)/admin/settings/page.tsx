import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { savePlatformSettingAction } from "@/actions/account";
import { PageHeader } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export default async function AdminSettingsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "general").maybeSingle();
  const value = (data?.value ?? {}) as { schoolYear?: string; supportEmail?: string };

  return (
    <div>
      <PageHeader title="Settings" description="School year and support contact used across the platform." />
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <ActionForm action={savePlatformSettingAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="schoolYear">School year</Label>
              <Input id="schoolYear" name="schoolYear" defaultValue={value.schoolYear ?? ""} placeholder="2026-2027" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support email</Label>
              <Input id="supportEmail" name="supportEmail" type="email" defaultValue={value.supportEmail ?? ""} />
            </div>
            <PendingButton>Save settings</PendingButton>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
