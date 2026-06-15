import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  icon: Icon,
  growth,
  iconBg,
}: {
  title: string;
  value?: number | string | null;
  icon: React.ComponentType<{ className?: string }>;
  growth?: string;
  iconBg: string;
}) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-bold tracking-tight text-foreground font-sans">
          {value?.toLocaleString("en-IN") ?? "0"}
        </span>
        {growth && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 bg-stone-900 dark:bg-stone-950/30 dark:text-amber-500 px-2 py-0.5 rounded-full shrink-0">
              <ArrowUpRight className="size-3 shrink-0" />
              {growth}
            </span>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
              vs last month
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function RateCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow flex items-center justify-between">
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-3xl font-bold tracking-tight text-foreground block font-sans">
          {value}
        </span>
        {subtext && <span className="text-[10px] text-muted-foreground block">{subtext}</span>}
      </div>
      <Icon className={`size-8 shrink-0 ${iconColor} opacity-20`} />
    </Card>
  );
}
