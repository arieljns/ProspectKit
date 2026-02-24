import { Toaster } from "@/components/shared/ui/sonner";
import { TooltipProvider } from "@/components/shared/ui/tooltip";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
