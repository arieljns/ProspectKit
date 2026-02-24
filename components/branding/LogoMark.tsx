import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type LogoMarkProps = React.HTMLAttributes<HTMLSpanElement> & {
  priority?: boolean;
};

export function LogoMark({ className, priority, ...props }: LogoMarkProps) {
  return (
    <span
      {...props}
      className={cn("relative inline-block h-6 w-6 shrink-0", className)}
    >
      <Image
        src="/marketing/logo.png"
        alt="ProspectKit"
        fill
        sizes="48px"
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}
