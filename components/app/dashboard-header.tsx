"use client";

import { signOut } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  userEmail: string;
};

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
      <p className="truncate text-sm text-zinc-400">{userEmail}</p>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
