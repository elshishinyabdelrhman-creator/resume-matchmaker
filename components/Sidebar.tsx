"use client";

import { AppSidebar } from "@/components/app/app-sidebar";

type SidebarProps = {
  userEmail: string;
};

/**
 * Default-export sidebar for layouts that import `@/components/Sidebar`.
 * Uses the same workspace nav as AppShell; pass `mobileVisible` via AppSidebar if needed from here.
 */
export default function Sidebar({ userEmail }: SidebarProps) {
  return <AppSidebar userEmail={userEmail} mobileVisible />;
}
