import React from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn("p-8 space-y-8 min-h-screen bg-background text-foreground", className)}>
      {children}
    </div>
  );
}
