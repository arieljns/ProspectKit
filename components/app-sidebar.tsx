"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3Icon,
  Building2Icon,
  HelpCircleIcon,
  Orbit,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/shadcnui/sidebar";
import { Oranienbaum } from "next/font/google";

const data = {
  user: {
    name: "Zebang Li",
    email: "zebang.li.2012@gmail.com",
    avatar: "https://ui-avatars.com/api/?name=Zebang+Li&background=334155&color=fff&size=128",
  },
  navMain: [
    {
      title: "Pipeline Analytics",
      url: "/analytics",
      icon: BarChart3Icon,
    },
    {
      title: "Manage Leads",
      url: "/contacts",
      icon: UsersIcon,
    },
    {
      title: "Discover Companies",
      url: "/dashboard",
      icon: Building2Icon,
    },
    {
      title: "Customization",
      url: "/settings/scoring",
      icon: SettingsIcon,
    },
  ],
  navSecondary: [
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/">
                <Orbit className="h-6 w-6" />
                <span className="text-base font-bold">Orbit SDR</span>
                <span className="text-[10px] text-muted-foreground">powered by Grok</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
