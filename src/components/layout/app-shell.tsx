"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { logoutAction } from "@/actions/auth";
import { Menu, LogOut, Bell } from "lucide-react";
import { ROLE_NAV } from "@/lib/auth/nav";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

function NavLinks({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Main">
      {ROLE_NAV[role].map((item) => {
        const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-white" : "text-slate-300 hover:bg-sidebar-accent hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ profile, unreadCount, children }: { profile: Profile; unreadCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const role = profile.role;
  const home = `/${role}`;
  const brand = useMemo(
    () => (
      <Link href={home} className="mb-6 flex items-center gap-2 px-2 font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500">E</span>
        <span>
          EduBridge
          <span className="block text-xs font-normal text-slate-400">{ROLE_LABELS[role]}</span>
        </span>
      </Link>
    ),
    [home, role],
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-sidebar p-4 lg:block">
        {brand}
        <NavLinks role={role} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              {brand}
              <NavLinks role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="hidden text-sm text-muted-foreground md:block">EduBridge Connect</p>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild aria-label="Notifications">
              <Link href={`${home}/notifications`} className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                    <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left text-sm sm:block">
                    <span className="block font-medium leading-tight">{profile.full_name}</span>
                    <span className="block text-xs text-muted-foreground">{profile.email}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`${home}/profile`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${home}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 h-px bg-border" />
                <DropdownMenuItem onClick={() => void logoutAction()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
