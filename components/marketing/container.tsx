import { cn } from "@/lib/utils";
import React from "react";

export const Container = <T extends React.ElementType = "div">({
  children,
  className,
  as,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: T;
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  "children" | "className" | "as"
>) => {
  const Component = as || "div";
  return (
    <Component {...props} className={cn("max-w-7xl mx-auto", className)}>
      {children}
    </Component>
  );
};
