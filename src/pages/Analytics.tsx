import React, { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lightbulb } from "lucide-react";
import { CHANNEL_COLOR } from "@/constants";

const PIE_COLORS = ["#10b981", "#f59e0b", "#94a3b8", "#ef4444"];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const { data } = useAnalytics(dateRange);

  if (!data) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">ROI Insights</h1>
        <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Total customers" v={data.total_customers} />
        <Metric label="Campaigns sent" v={data.total_campaigns} />
        <Metric label="Avg open rate" v={`${data.avg_open_rate}%`} />
        <Metric label="Avg click rate" v={`${data.avg_click_rate}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-medium mb-4 text-foreground">Messages by channel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.by_channel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="channel"
                axisLine={false}
                tickLine={false}
                className="capitalize text-xs text-foreground"
              />
              <YAxis axisLine={false} tickLine={false} className="text-xs text-foreground" />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="sent" name="Sent" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" name="Delivered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" name="Opened" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicked" name="Clicked" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="font-medium mb-4 text-foreground">Customer engagement breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.engagement_segments}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.engagement_segments.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                iconType="circle"
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: "12px", lineHeight: "24px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-medium mb-4 text-foreground">Top performing campaigns</h2>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-foreground">Campaign Name</TableHead>
                <TableHead className="text-foreground">Channel</TableHead>
                <TableHead className="text-right text-foreground">Recipients</TableHead>
                <TableHead className="text-right text-foreground">Open Rate</TableHead>
                <TableHead className="text-right text-foreground">Click Rate</TableHead>
                <TableHead className="text-right text-foreground">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.top_campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.top_campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`capitalize ${CHANNEL_COLOR[c.channel] || ""}`}
                      >
                        {c.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground">{c.recipients}</TableCell>
                    <TableCell className="text-right text-foreground">{c.openRate}%</TableCell>
                    <TableCell className="text-right text-foreground">{c.clickRate}%</TableCell>
                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-500">
                      ₹{c.revenue.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5 bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30">
        <div className="flex gap-3 items-start text-amber-900 dark:text-amber-200">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full shrink-0">
            <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-semibold text-sm mb-1">AI Insight: Optimal Send Times</div>
            <div className="text-sm opacity-90 leading-relaxed">
              Based on the last 30 days of interaction data, your <strong>WhatsApp</strong> messages
              see a <strong>24% higher engagement rate</strong> when sent between{" "}
              <strong>6 PM and 8 PM</strong> compared to morning blasts. Consider scheduling your
              upcoming "New Product Launch" campaign for the evening window.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, v }: { label: string; v: any }) {
  return (
    <Card className="p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold mt-1 text-foreground">{v}</div>
    </Card>
  );
}
