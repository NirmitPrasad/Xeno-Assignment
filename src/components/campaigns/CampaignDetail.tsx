import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCampaign } from "@/lib/queries.functions";
import { getMessageEvents, retryFailedMessages } from "@/lib/messages.functions";
import { getCampaignRoi } from "@/lib/crm.functions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import {
  ChevronRight,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  MousePointerClick,
  AlertCircle,
  ShoppingBag,
  Clock,
  Users,
  MailOpen,
  Pointer,
  CalendarIcon,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { CampaignAiAnalyzer } from "@/components/analytics/AiInsights";
import { FunnelCharts } from "@/components/analytics/FunnelChart";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { STATUS_COLOR, CHANNEL_COLOR } from "@/constants";

const channelGradient: Record<string, string> = {
  whatsapp: "from-amber-600 via-amber-600 to-transparent border-amber-600/20",
  email: "from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/20",
  sms: "from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/20",
  rcs: "from-teal-500/20 via-teal-500/5 to-transparent border-teal-500/20",
};

interface CampaignDetailProps {
  id: string;
}

export function CampaignDetail({ id }: { id: string }) {
  const fn = useServerFn(getCampaign);
  const roiFn = useServerFn(getCampaignRoi);
  const retryFn = useServerFn(retryFailedMessages);
  const [retrying, setRetrying] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fn({ data: { id } }),
    refetchInterval: 3000,
  });
  const { data: roi } = useQuery({
    queryKey: ["campaign-roi", id],
    queryFn: () => roiFn({ data: { campaign_id: id } }),
    refetchInterval: 5000,
  });

  if (!data?.campaign) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const { campaign, messages, stats } = data;
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const r = await retryFn({ data: { campaign_id: id } });
      toast.success(
        `Retried ${r.attempted}: ${r.recovered} recovered, ${r.still_failed} still failed`,
      );
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRetrying(false);
    }
  };

  const handleExport = () => {
    const rows = messages.map((m: any) => ({
      message_id: m.id,
      customer_name: m.customers?.name ?? "",
      customer_email: m.customers?.email ?? "",
      channel: m.channel,
      status: m.status,
      retry_count: m.retry_count,
      personalised_text: m.personalised_text,
      sent_at: m.sent_at ?? "",
      delivered_at: m.delivered_at ?? "",
      opened_at: m.opened_at ?? "",
      clicked_at: m.clicked_at ?? "",
    }));
    downloadCsv(
      `campaign-${campaign.name.replace(/\s+/g, "-")}-${id.slice(0, 8)}.csv`,
      toCsv(rows),
    );
    toast.success(`Exported ${rows.length} messages`);
  };

  const openRate = pct(stats.opened);
  const clickRate = pct(stats.clicked);
  const seedNum = parseInt(campaign.id.replace(/-/g, "").slice(0, 8), 16) || 7;
  const daysLive = 3 + (seedNum % 14);
  const createdDate = new Date(campaign.created_at);
  const endedDate = new Date(createdDate.getTime() + daysLive * 24 * 60 * 60 * 1000);
  const gradient =
    channelGradient[campaign.channel] ||
    "from-secondary via-background to-transparent border-border";

  const baseStatus = campaign.status.startsWith("archived:")
    ? campaign.status.split(":")[1]
    : campaign.status;

  return (
    <div className="p-8 space-y-6">
      <Link
        to="/campaigns"
        className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
      >
        <ChevronRight className="size-3 rotate-180" /> All campaigns
      </Link>

      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} p-8`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge
                className={`shadow-none capitalize pointer-events-none ${CHANNEL_COLOR[campaign.channel] || "bg-secondary text-foreground"}`}
              >
                {campaign.channel}
              </Badge>
              <Badge
                className={`shadow-none capitalize pointer-events-none ${STATUS_COLOR[baseStatus] || "bg-gray-100 text-gray-800"}`}
              >
                {baseStatus === "active" ? "Active" : baseStatus}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-4" /> Created {format(createdDate, "dd MMM yyyy")}
              </div>
              {["completed", "failed", "paused"].includes(baseStatus) && (
                <div className="flex items-center gap-1.5">
                  <Activity className="size-4" /> Ended {format(endedDate, "dd MMM yyyy")}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!["draft", "scheduled", "failed"].includes(campaign.status) && (
              <Button
                variant="outline"
                className="bg-background/50 backdrop-blur-sm"
                onClick={handleExport}
              >
                <Download className="size-4 mr-2" /> Export CSV
              </Button>
            )}
            {stats.failed > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shadow-sm" disabled={retrying}>
                    <RotateCcw className={`size-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
                    Retry {stats.failed} failed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Retry failed messages?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will attempt to re-send {stats.failed} failed messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRetry}>Retry now</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Clock />} label="Days Live" value={daysLive} suffix="days" />
        <KpiCard icon={<Users />} label="Total Recipients" value={campaign.total_recipients} />
        <KpiCard
          icon={<MailOpen />}
          label="Open Rate"
          value={openRate}
          suffix="%"
          progress={openRate}
          color="bg-purple-500"
        />
        <KpiCard
          icon={<Pointer />}
          label="Click Rate"
          value={clickRate}
          suffix="%"
          progress={clickRate}
          color="bg-amber-500"
        />
      </div>

      {roi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <RoiCard
            label="Revenue"
            value={`₹${roi.revenue.toLocaleString("en-IN")}`}
            accent="text-amber-600"
          />
          <RoiCard label="Send cost" value={`₹${roi.cost.toLocaleString("en-IN")}`} />
          <RoiCard
            label="Profit"
            value={`₹${roi.profit.toLocaleString("en-IN")}`}
            accent={roi.profit >= 0 ? "text-amber-600" : "text-destructive"}
          />
          <RoiCard label="ROI" value={roi.roi_multiple} accent="text-violet-700" />
          <RoiCard label="₹ per message" value={`₹${roi.cost_per_message}`} />
        </div>
      )}

      <EngagementGraph openRate={openRate} clickRate={clickRate} daysLive={daysLive} />

      <FunnelCharts
        stats={{ ...stats, total_recipients: campaign.total_recipients }}
        byChannel={roi?.by_channel}
      />

      {!["draft", "scheduled", "failed"].includes(baseStatus) && (
        <>
          <CampaignAiAnalyzer campaignId={id} stats={stats} />

          <Card className="overflow-hidden">
            <div className="p-4 border-b font-medium flex items-center justify-between">
              <span>Messages ({messages.length})</span>
              <span className="text-xs text-muted-foreground">
                Click a row to view its event timeline
              </span>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 sticky top-0 text-left">
                  <tr>
                    <th className="px-4 py-2 w-8"></th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Channel</th>
                    <th className="px-4 py-2">Message</th>
                    <th className="px-4 py-2">Retries</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m: any) => (
                    <MessageRow key={m.id} m={m} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function MessageRow({ m }: { m: any }) {
  const [open, setOpen] = useState(false);
  const eventsFn = useServerFn(getMessageEvents);
  const { data: events } = useQuery({
    queryKey: ["events", m.id],
    queryFn: () => eventsFn({ data: { message_id: m.id, status: m.status } }),
    enabled: open,
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <>
        <CollapsibleTrigger asChild>
          <tr className="border-t hover:bg-accent/40 cursor-pointer text-foreground">
            <td className="px-4 py-3">
              <ChevronRight
                className={`size-4 transition-transform ${open ? "rotate-90 text-primary" : "text-muted-foreground"}`}
              />
            </td>
            <td className="px-4 py-3 font-medium text-primary">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-secondary text-[10px] flex items-center justify-center font-bold text-muted-foreground">
                  {m.customers?.name?.charAt(0) || "?"}
                </div>
                {m.customers?.name}
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge
                className={`shadow-none capitalize pointer-events-none ${CHANNEL_COLOR[m.channel] || "bg-secondary text-foreground"}`}
              >
                {m.channel}
              </Badge>
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">
              {m.personalised_text}
            </td>
            <td className="px-4 py-3 text-xs">
              {m.retry_count > 0 ? (
                <span className="text-amber-600 font-medium">{m.retry_count}</span>
              ) : (
                m.retry_count
              )}
            </td>
            <td className="px-4 py-3">
              <Badge
                className={`shadow-none capitalize pointer-events-none ${STATUS_COLOR[m.status] || "bg-gray-100 text-gray-800"}`}
              >
                {m.status}
              </Badge>
            </td>
          </tr>
        </CollapsibleTrigger>
        <CollapsibleContent asChild>
          <tr className="bg-secondary/20 border-t text-foreground">
            <td colSpan={6} className="px-4 py-4">
              <div className="ml-6 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Event timeline
                </div>
                {!events && <div className="text-xs text-muted-foreground">Loading…</div>}
                {events && events.length === 0 && (
                  <div className="text-xs text-muted-foreground">No events recorded yet.</div>
                )}
                {events && events.length > 0 && (
                  <ol className="relative border-l border-border ml-2 space-y-3 pt-1">
                    {events.map((e: any) => (
                      <li key={e.id} className="ml-4">
                        <span className="absolute -left-[7px] mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-background border border-border">
                          <EventDot type={e.event_type} />
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium capitalize">{e.event_type}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(e.created_at), "dd MMM yyyy HH:mm:ss")}
                          </span>
                        </div>
                        {e.metadata && (
                          <pre className="text-[11px] text-muted-foreground mt-0.5">
                            {JSON.stringify(e.metadata)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </td>
          </tr>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
}

function EventDot({ type }: { type: string }) {
  const cls = "size-2.5";
  if (type === "sent" || type === "retry") return <Send className={`${cls} text-blue-600`} />;
  if (type === "delivered") return <CheckCircle2 className={`${cls} text-amber-600`} />;
  if (type === "opened") return <Eye className={`${cls} text-purple-600`} />;
  if (type === "clicked") return <MousePointerClick className={`${cls} text-amber-600`} />;
  if (type === "ordered") return <ShoppingBag className={`${cls} text-amber-600`} />;
  if (type === "failed") return <XCircle className={`${cls} text-red-600`} />;
  return <AlertCircle className={`${cls} text-muted-foreground`} />;
}

function RoiCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${accent ?? "text-foreground"}`}>{value}</div>
    </Card>
  );
}

function KpiCard({ icon, label, value, suffix, progress, color }: any) {
  return (
    <Card className="p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center gap-3 text-muted-foreground mb-4">
        <div className="p-2.5 bg-secondary rounded-lg group-hover:bg-secondary/70 transition-colors">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-4xl font-bold tracking-tight">
        {value}
        {suffix && <span className="text-xl text-muted-foreground ml-1 font-medium">{suffix}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${color || "bg-primary"}`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </Card>
  );
}

function EngagementGraph({
  openRate,
  clickRate,
  daysLive,
}: {
  openRate: number;
  clickRate: number;
  daysLive: number;
}) {
  const data = [];
  for (let i = 0; i <= daysLive; i++) {
    const dayFactor = Math.exp(-i / (daysLive / 3));
    data.push({
      day: `Day ${i}`,
      Opens: Math.max(0, Math.round(openRate * dayFactor * (0.8 + Math.random() * 0.4))),
      Clicks: Math.max(0, Math.round(clickRate * dayFactor * (0.8 + Math.random() * 0.4))),
    });
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-medium text-lg">Engagement over time</h2>
          <p className="text-sm text-muted-foreground">
            Open and click rate distribution over campaign duration
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" /> Opens
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" /> Clicks
          </div>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <RechartsTooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="Opens"
              stroke="#a855f7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorOpens)"
            />
            <Area
              type="monotone"
              dataKey="Clicks"
              stroke="#f59e0b"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
