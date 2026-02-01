import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/shadcnui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/shadcnui/sonner";
import { TooltipProvider } from "@/components/shadcnui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orbit SDR",
  description: "Grok-powered Sales Development Representative system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
