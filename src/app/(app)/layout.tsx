import { requireProfile } from "@/lib/auth/session";
import { unreadCount } from "@/lib/data/records";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const count = await unreadCount(profile.id);
  return (
    <AppShell profile={profile} unreadCount={count}>
      {children}
    </AppShell>
  );
}
