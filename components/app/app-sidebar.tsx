"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Briefcase,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Target,
} from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/new-job", label: "New Job", icon: PlusCircle },
  { href: "/resume", label: "Resumes", icon: FileText },
  { href: "/applications/board", label: "Applications", icon: Briefcase },
  { href: "/match", label: "Job Match", icon: Target },
  { href: "/tailor", label: "AI Tailor", icon: Sparkles },
  { href: "/ats", label: "ATS Scoring", icon: Award },
] as const;

function linkActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = linkActive(pathname, href);
        return (
          <Link
            key={`${href}-${label}`}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

type AppSidebarProps = {
  userEmail: string;
  /** When true, sidebar is shown on small screens too (e.g. dedicated dashboard shell). */
  mobileVisible?: boolean;
};

export function AppSidebar({ userEmail, mobileVisible = false }: AppSidebarProps) {
  const pathname = usePathname();
  const initial =
    userEmail.trim().length > 0
      ? userEmail.trim()[0]!.toUpperCase()
      : "?";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-svh w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100",
        mobileVisible ? "flex" : "hidden md:flex",
      )}
    >
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-bold tracking-tight">ResumeMatch</h1>
        <p className="text-xs text-zinc-500">AI Career Assistant</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = linkActive(pathname, href);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Your account</p>
            <p className="truncate text-xs text-zinc-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
