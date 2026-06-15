import React from "react";
import {
  ShoppingBag,
  ArrowUpRight,
  Eye as EyeIcon,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";

function getRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  created_at: string;
  channel: string;
  customer_name: string;
  campaign_name: string;
}

export function ActivityFeed({
  events,
  isLoading,
}: {
  events?: ActivityEvent[];
  isLoading: boolean;
}) {
  return (
    <Card className="p-6 md:col-span-2 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2 font-sans">
          <span className="size-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          Live activity
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-sans">
          Real-time message events feed
        </p>
      </div>
      <div className="flex-1 mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center font-sans">
            Loading events...
          </div>
        ) : events && events.length > 0 ? (
          <div className="divide-y divide-secondary min-w-[500px]">
            {events.map((ev) => {
              const Icon =
                ev.event_type === "ordered"
                  ? ShoppingBag
                  : ev.event_type === "clicked"
                    ? ArrowUpRight
                    : ev.event_type === "opened"
                      ? EyeIcon
                      : ev.event_type === "delivered"
                        ? CheckCircle2
                        : ev.event_type === "failed"
                          ? AlertCircle
                          : Send;

              const iconColor =
                ev.event_type === "ordered"
                  ? "text-amber-600 bg-stone-900 dark:bg-stone-950/30 dark:text-amber-500"
                  : ev.event_type === "clicked"
                    ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : ev.event_type === "opened"
                      ? "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400"
                      : ev.event_type === "delivered"
                        ? "text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400"
                        : ev.event_type === "failed"
                          ? "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400"
                          : "text-slate-500 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400";

              return (
                <div
                  key={ev.id}
                  className="py-2.5 flex items-center justify-between gap-4 text-xs font-sans"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground">{ev.customer_name}</span>
                      <span className="text-muted-foreground mx-1">triggered</span>
                      <span className="font-medium text-foreground lowercase">{ev.event_type}</span>
                      <span className="text-muted-foreground mx-1">for</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px] inline-block align-bottom">
                        {ev.campaign_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-secondary text-slate-700 dark:text-slate-300 text-[9px] uppercase font-bold">
                      {ev.channel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {getRelativeTime(ev.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-12 text-center font-sans">
            No recent message events. Launch a campaign to see live feed.
          </div>
        )}
      </div>
    </Card>
  );
}
