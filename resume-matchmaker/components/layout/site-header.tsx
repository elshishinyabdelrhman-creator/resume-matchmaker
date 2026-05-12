import Link from "next/link";
import { FileText } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <FileText className="size-4" aria-hidden />
          </span>
          <span className="hidden text-base sm:inline sm:text-lg">Resume Matchmaker</span>
        </Link>

        <nav
          className="flex flex-1 items-center justify-end gap-1 sm:gap-2"
          aria-label="Main"
        >
          <div className="hidden items-center gap-1 sm:flex sm:mr-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/#features">Features</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/#how-it-works">How it works</Link>
            </Button>
          </div>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <ThemeToggle />
          {user ? (
            <Button size="sm" className="shrink-0" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="shrink-0" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="shrink-0" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
