import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/providers/theme-provider";
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
