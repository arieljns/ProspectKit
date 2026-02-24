"use client";

import * as React from "react";

import { SidebarProvider, SidebarInset } from "@/components/shared/ui/sidebar";
import { AppSidebar } from "@/components/workspace/layout/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
