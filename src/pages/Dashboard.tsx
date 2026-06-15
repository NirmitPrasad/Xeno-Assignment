import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getDashboardData } from "@/lib/queries.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, ShoppingBag, Megaphone, Send, ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MetricCard, RateCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ActiveCampaigns } from "@/components/dashboard/ActiveCampaigns";
import { FunnelAreaChart } from "@/components/analytics/FunnelChart";
import { ChannelChart } from "@/components/analytics/ChannelChart";
import { AIInsightCard } from "@/components/analytics/AIInsightCard";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#22c55e", "#f97316", "#ec4899", "#a855f7"];

function formatIndianCurrency(num: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Custom simple Icons for card backgrounds to avoid loading extra bundles
function RupeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13h12" />
      <path d="M6 13a6 6 0 0 1 0 12" />
      <path d="M9 13l9 9" />
    </svg>
  );
}

function TrendingUpCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const getDashboardDataFn = useServerFn(getDashboardData);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: () => getDashboardDataFn(),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success("Dashboard data updated.");
    } finally {
      setRefreshing(false);
    }
  };

  const hasData = data && data.totalCustomers > 0;

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview of your store, customers, and active campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons could go here */}
        </div>
      </div>

      {/* Metric Cards Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cafe Guests"
          value={isLoading ? "..." : data?.totalCustomers}
          icon={Users}
          growth={hasData ? "8%" : undefined}
          iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
        />
        <MetricCard
          title="Brews Placed"
          value={isLoading ? "..." : data?.totalOrders}
          icon={ShoppingBag}
          growth={hasData ? "12%" : undefined}
          iconBg="bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400"
        />
        <MetricCard
          title="Campaigns"
          value={isLoading ? "..." : data?.totalCampaigns}
          icon={Megaphone}
          growth={hasData ? "4%" : undefined}
          iconBg="bg-stone-900 text-amber-600 dark:bg-stone-950/30 dark:text-amber-500"
        />
        <MetricCard
          title="Offers Dispatched"
          value={isLoading ? "..." : data?.communicationsSent}
          icon={Send}
          growth={hasData ? "15%" : undefined}
          iconBg="bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
        />
      </div>

      {/* Metric Cards Row 2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RateCard
          title="Delivery Rate"
          value={isLoading ? "..." : hasData ? `${data?.deliveryRate}%` : "0%"}
          icon={Send}
          iconColor="text-indigo-500"
        />
        <RateCard
          title="Open Rate"
          value={isLoading ? "..." : hasData ? `${data?.openRate}%` : "0%"}
          icon={TrendingUpCardIcon}
          iconColor="text-teal-500"
        />
        <RateCard
          title="Click Rate"
          value={isLoading ? "..." : hasData ? `${data?.clickRate}%` : "0%"}
          icon={TrendingUpCardIcon}
          iconColor="text-amber-500"
        />
        <RateCard
          title="Conversion Rate"
          value={isLoading ? "..." : hasData ? `${data?.conversionRate}%` : "0%"}
          subtext={
            isLoading
              ? "..."
              : `₹${(data?.lifetimeRevenue ?? 0).toLocaleString("en-IN")} lifetime revenue`
          }
          icon={RupeeIcon}
          iconColor="text-amber-500"
        />
      </div>

      {/* Top Customers Strip */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground font-sans">
          Top Spenders
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="p-4 flex items-center gap-3 animate-pulse">
                  <div className="size-10 rounded-full bg-muted shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))
          ) : data?.topCustomers && data.topCustomers.length > 0 ? (
            data.topCustomers.map(
              (c: { id: string; name: string; total_spent: number; total_orders: number }) => {
                const initials = c.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <Link key={c.id} to="/customers/$id" params={{ id: c.id }} className="block">
                    <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer border hover:border-primary/30">
                      <div className="size-10 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 text-primary flex items-center justify-center font-bold text-sm shrink-0 font-sans">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1 font-sans">
                        <div className="font-semibold truncate text-sm text-foreground">
                          {c.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>₹{Number(c.total_spent).toLocaleString("en-IN")} spent</span>
                          <span>•</span>
                          <span>{c.total_orders} orders</span>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground/60 shrink-0" />
                    </Card>
                  </Link>
                );
              },
            )
          ) : (
            <Card className="p-4 md:col-span-3 text-center text-xs text-muted-foreground font-sans">
              No spender data available.
            </Card>
          )}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Engagement Funnel */}
        <FunnelAreaChart data={data?.funnelData || []} isLoading={isLoading} />

        {/* Revenue by Category */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Revenue by Category
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Share of total order value</p>
          </div>
          <div className="h-64 mt-6 flex flex-col items-center justify-center relative">
            {isLoading ? (
              <span className="text-xs text-muted-foreground">Loading chart...</span>
            ) : hasData ? (
              <>
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie
                      data={data?.categoryRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data?.categoryRevenue.map(
                        (entry: { name: string; value: number }, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatIndianCurrency(Number(val))}
                      contentStyle={{
                        background: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2 text-[10px] text-slate-600 dark:text-slate-400 max-h-16 overflow-y-auto">
                  {data?.categoryRevenue.map(
                    (entry: { name: string; value: number }, index: number) => (
                      <div key={entry.name} className="flex items-center gap-1">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        ></span>
                        <span className="truncate max-w-[60px]">{entry.name}</span>
                      </div>
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <span className="text-xs text-slate-400 font-medium">No Data Available</span>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                  No orders found. Seed demo data to populate revenue.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 4: Channel Performance and AI Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Channel Performance */}
        <ChannelChart data={data?.channelPerformance} isLoading={isLoading} />

        {/* AI Insights */}
        <AIInsightCard
          insights={data?.insights}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </div>

      {/* Row 5: Active Campaigns and Live Activity */}
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
        {/* Active campaigns Widget */}
        <ActiveCampaigns campaigns={data?.runningCampaigns} isLoading={isLoading} />

        {/* Live activity Widget */}
        <ActivityFeed events={data?.liveEvents} isLoading={isLoading} />
      </div>
    </div>
  );
}
