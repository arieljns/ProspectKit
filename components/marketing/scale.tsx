import { cn } from "@/lib/utils";
import React from "react";

export const Scale = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 m-auto h-full w-full rounded-lg border border-gray-200 dark:border-neutral-800",
        "bg-white dark:bg-neutral-900",
        // Light diagonal lines - sparse, subtle
        "bg-[repeating-linear-gradient(135deg,_rgb(240_240_240)_0,_rgb(240_240_240)_1px,_transparent_1px,_transparent_16px)] dark:bg-[repeating-linear-gradient(135deg,_rgb(50_50_50)_0,_rgb(50_50_50)_1px,_transparent_1px,_transparent_16px)]",
        "bg-[size:23px_23px]",
        className,
      )}
    />
  );
};
