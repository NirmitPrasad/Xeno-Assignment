import React from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChannelPerformanceData {
  channel: string;
  opened: number;
  clicked: number;
}

export function ChannelChart({
  data,
  isLoading,
}: {
  data?: ChannelPerformanceData[];
  isLoading: boolean;
}) {
  return (
    <Card className="p-6 md:col-span-2 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Channel Performance
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Opens vs clicks by channel</p>
      </div>
      <div className="h-64 mt-6 flex items-center justify-center">
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading chart...</span>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <XAxis
                dataKey="channel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
              />
              <Bar
                dataKey="opened"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
                barSize={20}
                name="opened"
              />
              <Bar
                dataKey="clicked"
                fill="#06b6d4"
                radius={[3, 3, 0, 0]}
                barSize={20}
                name="clicked"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs text-slate-400 font-medium">No Data Available</span>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
              No channel stats. Launch campaigns to track opens/clicks.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
