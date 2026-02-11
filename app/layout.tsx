import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/shadcnui/sonner";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { interDisplay } from "@/app/fonts/inter-display/inter";
import { dmMono } from "@/app/fonts/dm-mono";

export const metadata: Metadata = {
  title: "ProspectKit",
  description: "Open-source outbound workspace for small teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interDisplay.variable} ${dmMono.variable} min-h-screen font-primary antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
