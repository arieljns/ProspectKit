"use client";

import { cn } from "@/lib/utils";

interface PixelatedCanvasProps {
  isActive: boolean;
  className?: string;
  size?: number;
  duration?: number;
  fillColor?: string;
  backgroundColor?: string;
}

export function PixelatedCanvas({
  isActive,
  className,
  size = 4,
  duration = 2500,
  fillColor = "var(--color-brand)",
  backgroundColor = "var(--color-gray-200, white)",
}: PixelatedCanvasProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(${fillColor} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        animation: isActive
          ? `shimmer ${duration / 1000}s linear infinite`
          : undefined,
        imageRendering: "pixelated",
      }}
    />
  );
}
