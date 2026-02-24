"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusCircleIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shared/ui/sidebar";
import { AddContactDialog } from "@/components/workspace/contacts/add-contact-dialog";
import { AddCompanyDialog } from "@/components/workspace/companies/add-company-dialog";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const router = useRouter();
  const [isQuickAddExpanded, setIsQuickAddExpanded] = React.useState(false);
  const [addContactDialogOpen, setAddContactDialogOpen] = React.useState(false);
  const [addCompanyDialogOpen, setAddCompanyDialogOpen] = React.useState(false);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-col gap-1">
            <SidebarMenuButton
              tooltip="Quick Add"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={() => setIsQuickAddExpanded(!isQuickAddExpanded)}
            >
              <PlusCircleIcon />
              <span>Quick Add</span>
              {isQuickAddExpanded ? (
                <ChevronUpIcon className="ml-auto h-4 w-4" />
              ) : (
                <ChevronDownIcon className="ml-auto h-4 w-4" />
              )}
            </SidebarMenuButton>

            {isQuickAddExpanded && (
              <div className="flex flex-col gap-1 pl-4 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-sm"
                  onClick={() => {
                    setAddContactDialogOpen(true);
                    setIsQuickAddExpanded(false);
                  }}
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-sm"
                  onClick={() => {
                    setAddCompanyDialogOpen(true);
                    setIsQuickAddExpanded(false);
                  }}
                >
                  <Building2Icon className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Dialogs */}
      <AddContactDialog
        open={addContactDialogOpen}
        onOpenChange={setAddContactDialogOpen}
        onSuccess={() => {
          router.push("/app/contacts");
          router.refresh();
        }}
      />
      <AddCompanyDialog
        open={addCompanyDialogOpen}
        onOpenChange={setAddCompanyDialogOpen}
        onSuccess={() => {
          router.push("/app/dashboard");
          router.refresh();
        }}
      />
    </SidebarGroup>
  );
}
