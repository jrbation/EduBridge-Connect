import { PageHeader } from "@/components/shared/states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Localization, offline access, and email/SMS delivery are prepared for later releases." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>The interface is currently English. A translation layer can be added without changing these screens.</CardDescription>
          </CardHeader>
          <CardContent>
            <select className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="en" disabled>
              <option value="en">English</option>
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>In-app alerts are enabled. Email and SMS remain future integrations.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Offline mode</CardTitle>
            <CardDescription>The MVP requires a connection. Offline lesson packs can be added later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
