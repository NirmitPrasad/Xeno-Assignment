import React from "react";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

// ────────────── Dashboard Funnel (Area Chart) ──────────────

interface DashboardFunnelProps {
  data: any[];
  isLoading?: boolean;
}

export function FunnelAreaChart({ data, isLoading }: DashboardFunnelProps) {
  return (
    <Card className="p-6 md:col-span-2 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Engagement Funnel</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Lifecycle across all campaigns</p>
      </div>
      <div className="h-64 mt-6 flex items-center justify-center">
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading chart...</span>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="stage"
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
                labelClassName="font-medium text-slate-800 dark:text-slate-200"
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                fillOpacity={1}
                fill="url(#funnelGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs text-slate-400 font-medium">No Data Available</span>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
              No communications launched. Seed demo data to see the funnel.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ────────────── Campaigns Detail Funnel (Pie/Bar Outcome Breakdown) ──────────────

const PIE_COLORS = {
  Delivered: "#22c55e",
  Opened: "#a855f7",
  Clicked: "#f59e0b",
  Ordered: "#059669",
  Failed: "#ef4444",
  "Not delivered": "#cbd5e1",
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#22c55e",
  sms: "#3b82f6",
  email: "#6366f1",
  rcs: "#14b8a6",
};

export function FunnelCharts({
  stats,
  byChannel,
}: {
  stats: any;
  byChannel?: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    ordered: number;
    revenue?: number;
  }[];
}) {
  const total = stats.total_recipients ?? stats.total ?? 0;
  const delivered = stats.delivered ?? 0;
  const opened = stats.opened ?? 0;
  const clicked = stats.clicked ?? 0;
  const ordered = stats.ordered ?? 0;
  const failed = stats.failed ?? 0;

  const outcomeData = [
    { name: "Ordered", value: ordered },
    { name: "Clicked", value: Math.max(0, clicked - ordered) },
    { name: "Opened", value: Math.max(0, opened - clicked) },
    { name: "Delivered", value: Math.max(0, delivered - opened) },
    { name: "Failed", value: failed },
    { name: "Not delivered", value: Math.max(0, total - delivered - failed) },
  ].filter((d) => d.value > 0);

  const funnelData = [
    { stage: "Sent", count: stats.sent ?? 0 },
    { stage: "Delivered", count: delivered },
    { stage: "Opened", count: opened },
    { stage: "Clicked", count: clicked },
    { stage: "Ordered", count: ordered },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Outcome breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={outcomeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {outcomeData.map((d) => (
                  <Cell key={d.name} fill={(PIE_COLORS as any)[d.name] ?? "#888"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Funnel</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={11} />
              <YAxis dataKey="stage" type="category" fontSize={12} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {byChannel && byChannel.length > 1 && (
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-medium mb-3">By channel</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byChannel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="channel" fontSize={12} tickFormatter={(v) => v.toUpperCase()} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="delivered" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ordered" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs mt-3">
            {byChannel.map((c) => (
              <div key={c.channel} className="border rounded p-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: CHANNEL_COLORS[c.channel] ?? "#888" }}
                  />
                  <span className="font-medium capitalize">{c.channel}</span>
                </div>
                <div className="text-muted-foreground mt-1">
                  {c.ordered} orders · ₹{(c.revenue ?? 0).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
