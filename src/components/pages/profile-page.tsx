import { requireProfile } from "@/lib/auth/session";
import { updateProfileAction } from "@/actions/account";
import { PageHeader } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <div>
      <PageHeader title="Profile" description="Your name and photo are visible to teachers and classmates you share classes with." />
      <Card>
        <CardContent className="pt-6">
          <ActionForm action={updateProfileAction} className="grid max-w-lg gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile picture</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
            </div>
            <p className="text-sm text-muted-foreground">Email: {profile.email}</p>
            <PendingButton>Save profile</PendingButton>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
