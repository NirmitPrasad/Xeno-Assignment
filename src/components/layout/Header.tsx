import React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, className, children }: HeaderProps) {
  return (
    <div className={cn("flex items-center justify-between border-b pb-5", className)}>
      <div>
        <h1
          className="text-3xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
