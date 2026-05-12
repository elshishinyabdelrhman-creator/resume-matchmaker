"use client";

import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { AppSidebar, AppSidebarNav } from "@/components/app/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background md:flex-row">
      <AppSidebarNav />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur sm:px-6">
          <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <nav className="mb-8 flex gap-4">
            <Link href="/" className="text-blue-400 hover:underline">
              New Application
            </Link>
            <Link href="/applications" className="text-blue-400 hover:underline">
              My Applications
            </Link>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
