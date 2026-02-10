"use client";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

function TextShimmerCore({
  children,
  as: Component = "p",
  className,
  duration = 2.2,
  spread = 2,
}: TextShimmerProps) {
  const Tag = Component as React.ElementType;

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <Tag
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundPosition: "0% center",
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          animation: `shimmer ${duration}s linear infinite`,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

export const ShimmerText = React.memo(TextShimmerCore);
