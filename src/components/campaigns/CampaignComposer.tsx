import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { launchCampaign, previewCampaign } from "@/lib/crm.functions";
import { segmentPreviewAi } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Mail,
  Smartphone,
  Radio,
  Rocket,
  Eye,
  Users,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Channel = "whatsapp" | "sms" | "email" | "rcs";

const CHANNELS: {
  id: Channel;
  label: string;
  icon: any;
  color: string;
  bg: string;
  charLimit: number;
  costInr: number;
  desc: string;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "text-amber-600",
    bg: "bg-stone-900 border-amber-600",
    charLimit: 1024,
    costInr: 0.58,
    desc: "Highest engagement",
  },
  {
    id: "sms",
    label: "SMS",
    icon: Smartphone,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-500",
    charLimit: 160,
    costInr: 0.15,
    desc: "Universal reach",
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-500",
    charLimit: 5000,
    costInr: 0.04,
    desc: "Cheapest, long copy",
  },
  {
    id: "rcs",
    label: "RCS",
    icon: Radio,
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-500",
    charLimit: 2500,
    costInr: 0.32,
    desc: "Rich media on Android",
  },
];

export function CampaignComposer({
  defaultName,
  segmentDescription,
  sqlWhereClause,
  allIds,
  sampleCustomers,
  defaultMessage,
  defaultChannels,
}: {
  defaultName?: string;
  segmentDescription: string;
  sqlWhereClause: string;
  allIds: string[];
  sampleCustomers: { id: string; name: string; city?: string | null }[];
  defaultMessage?: string;
  defaultChannels?: Channel[];
}) {
  const launchFn = useServerFn(launchCampaign);
  const previewFn = useServerFn(previewCampaign);
  const segmentPreviewFn = useServerFn(segmentPreviewAi);

  const [name, setName] = useState(defaultName ?? segmentDescription.slice(0, 60));
  const [message, setMessage] = useState(
    defaultMessage ??
      "Hi {name}! We miss your morning brew routine. Here's 20% off your next Artisanal Cold Brew or Latte order — use code BREW20!",
  );
  const [channels, setChannels] = useState<Channel[]>(
    defaultChannels?.length ? defaultChannels : ["whatsapp"],
  );
  const [mode, setMode] = useState<"all" | "select">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>(sampleCustomers.map((c) => c.id));
  const [search, setSearch] = useState("");
  const [previews, setPreviews] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [launched, setLaunched] = useState<{ id: string; count: number } | null>(null);
  const [aiPreview, setAiPreview] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const toggleChannel = (c: Channel) =>
    setChannels((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const recipientIds = mode === "all" ? allIds : selectedIds;
  const filteredSamples = sampleCustomers.filter((c) =>
    !search ? true : (c.name + " " + (c.city ?? "")).toLowerCase().includes(search.toLowerCase()),
  );

  const minLimit = Math.min(...channels.map((c) => CHANNELS.find((x) => x.id === c)!.charLimit));
  const overLimit = message.length > minLimit;
  const estCost = channels.reduce(
    (s, c) => s + CHANNELS.find((x) => x.id === c)!.costInr * recipientIds.length,
    0,
  );

  const handlePreview = async () => {
    if (channels.length === 0) return toast.error("Pick at least one channel");
    setBusy(true);
    try {
      const r = await previewFn({
        data: { message_template: message, customer_ids: recipientIds.slice(0, 5), channels },
      });
      setPreviews(r.previews);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleAiPreview = async () => {
    setAiLoading(true);
    try {
      const r = await segmentPreviewFn({
        data: {
          description: segmentDescription,
          sql_where_clause: sqlWhereClause,
          channel: channels[0],
        },
      });
      setAiPreview(r);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (channels.length === 0) return toast.error("Pick at least one channel");
    if (recipientIds.length === 0) return toast.error("Pick at least one customer");
    if (
      overLimit &&
      !confirm(
        `Message is ${message.length} chars, over the ${minLimit}-char limit for one of the chosen channels. Launch anyway?`,
      )
    )
      return;
    setBusy(true);
    try {
      const r = await launchFn({
        data: {
          name,
          segment_description: segmentDescription,
          sql_where_clause: sqlWhereClause,
          message_template: message,
          channels,
          customer_ids: recipientIds,
        },
      });
      setLaunched({ id: r.campaign_id, count: r.total_recipients });
      toast.success(`Launched ${r.total_recipients} messages`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (launched) {
    return (
      <Card className="p-4 border-stone-700 bg-stone-900/50">
        <div className="flex items-center gap-2 text-amber-700">
          <Rocket className="size-4" />
          <span className="font-medium">Campaign launched</span>
          <Badge variant="outline">{launched.count} messages</Badge>
        </div>
        <Link
          to="/campaigns/$id"
          params={{ id: launched.id }}
          className="text-sm text-primary underline mt-2 inline-block"
        >
          View live message flow →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 border-primary/30">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Campaign name
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Send via
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = channels.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleChannel(c.id)}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  active
                    ? `${c.bg} ${c.color}`
                    : "border-border bg-background hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`size-4 ${active ? c.color : "text-muted-foreground"}`} />
                  <Checkbox checked={active} className="pointer-events-none" />
                </div>
                <div className="font-semibold text-sm">{c.label}</div>
                <div className="text-[11px] text-muted-foreground">{c.desc}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {c.charLimit} char · ₹{c.costInr}/msg
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {channels.length === 0
            ? "Pick at least one channel."
            : `Each recipient gets one message on each of ${channels.length} channel${channels.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Recipients
        </div>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border ${
              mode === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background"
            }`}
          >
            <Users className="size-3.5" /> All ({allIds.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("select")}
            className={`px-3 py-1.5 rounded-md text-sm border ${
              mode === "select"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background"
            }`}
          >
            Select ({selectedIds.length})
          </button>
        </div>
        {mode === "select" && (
          <div className="space-y-2 border rounded p-2">
            <div className="relative">
              <Search className="size-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground px-1">
              <button
                onClick={() => setSelectedIds(filteredSamples.map((c) => c.id))}
                className="hover:underline"
              >
                Select all shown
              </button>
              <button onClick={() => setSelectedIds([])} className="hover:underline">
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filteredSamples.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-accent rounded px-1"
                >
                  <Checkbox
                    checked={selectedIds.includes(c.id)}
                    onCheckedChange={(v) =>
                      setSelectedIds((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))
                    }
                  />
                  <span>{c.name}</span>
                  {c.city && <span className="text-xs text-muted-foreground">· {c.city}</span>}
                </label>
              ))}
              {filteredSamples.length === 0 && (
                <div className="text-xs text-muted-foreground p-2">No matches.</div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Showing top {sampleCustomers.length} samples from the segment. Use "All" to reach the
              full {allIds.length}-customer segment.
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Message
          </div>
          <div
            className={`text-[11px] ${overLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}
          >
            {message.length} / {minLimit} chars
            {overLimit && <AlertCircle className="size-3 inline ml-1" />}
          </div>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use <code>{"{name}"}</code> and <code>{"{city}"}</code> for personalisation.
        </p>
      </div>

      {previews && previews.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Previews
          </div>
          {previews.map((p, i) => {
            const Icon = CHANNELS.find((c) => c.id === p.channel)?.icon ?? MessageCircle;
            return (
              <div key={i} className="text-xs bg-secondary/40 rounded p-2 border">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className="size-3" />
                  <span className="font-medium">{p.customer_name}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {p.channel}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{p.personalised_message}</div>
              </div>
            );
          })}
        </div>
      )}

      {aiPreview && (
        <Card className="p-3 bg-violet-50/60 border-violet-200 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-violet-600" />
            <span className="font-medium">AI segment forecast</span>{" "}
            <Badge variant="outline" className="text-[10px]">
              {aiPreview.prediction.confidence} confidence
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <Stat label="Open" v={`${Math.round(aiPreview.prediction.predicted_open_rate)}%`} />
            <Stat label="Click" v={`${Math.round(aiPreview.prediction.predicted_click_rate)}%`} />
            <Stat
              label="Order"
              v={`${Math.round(aiPreview.prediction.predicted_order_rate * 10) / 10}%`}
            />
            <Stat
              label="Revenue"
              v={`₹${Math.round(aiPreview.prediction.predicted_revenue_inr).toLocaleString("en-IN")}`}
            />
          </div>
          <p className="text-xs text-muted-foreground">{aiPreview.prediction.reasoning}</p>
          {aiPreview.prediction.warnings?.length > 0 && (
            <ul className="text-[11px] text-amber-700 list-disc ml-4">
              {aiPreview.prediction.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/40 rounded p-2 border">
        <span>
          Est. send cost: <strong className="text-foreground">₹{estCost.toFixed(2)}</strong> ·{" "}
          {recipientIds.length * channels.length} messages
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={handlePreview} disabled={busy}>
          <Eye className="size-4 mr-2" /> Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handleAiPreview} disabled={aiLoading}>
          {aiLoading ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          AI forecast
        </Button>
        <Button
          size="sm"
          onClick={handleLaunch}
          disabled={busy || channels.length === 0 || recipientIds.length === 0}
        >
          <Rocket className="size-4 mr-2" />
          Launch {recipientIds.length * channels.length} messages
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="bg-card border rounded p-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
