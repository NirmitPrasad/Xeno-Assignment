import React from "react";
import { Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RunningCampaign {
  id: string;
  name: string;
  channel: string;
  total_recipients: number;
  delivered: number;
}

export function ActiveCampaigns({
  campaigns,
  isLoading,
}: {
  campaigns?: RunningCampaign[];
  isLoading: boolean;
}) {
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Active campaigns</h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-sans">
          Campaigns currently running
        </p>
      </div>
      <div className="flex-1 mt-6 space-y-4">
        {isLoading ? (
          <div className="text-xs text-muted-foreground font-sans">Loading active campaigns...</div>
        ) : campaigns && campaigns.length > 0 ? (
          campaigns.map((c) => {
            const pct = c.total_recipients
              ? Math.min(100, Math.round((c.delivered / c.total_recipients) * 100))
              : 0;
            return (
              <div
                key={c.id}
                className="space-y-2 pb-3 border-b border-secondary last:border-0 last:pb-0 font-sans"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to="/campaigns/$id"
                    params={{ id: c.id }}
                    className="font-semibold text-sm truncate text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] uppercase font-bold shrink-0 dark:bg-purple-950/40 dark:text-purple-400">
                    {c.channel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {c.delivered} / {c.total_recipients} sent
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-48 py-4 px-2 font-sans">
            <Megaphone className="size-8 text-muted-foreground/40 mb-2 shrink-0" />
            <p className="text-xs text-muted-foreground">
              No campaigns running — start one in{" "}
              <Link to="/chat" className="text-primary underline font-medium">
                AI Assistant
              </Link>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
