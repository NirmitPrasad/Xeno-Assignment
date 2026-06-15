import React from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MessageCircle, Smartphone, Mail, Radio } from "lucide-react";

const channelIcons: Record<string, any> = {
  whatsapp: MessageCircle,
  sms: Smartphone,
  email: Mail,
  rcs: Radio,
};

interface ToolResultCardProps {
  part: any;
}

export function ToolResultCard({ part }: ToolResultCardProps) {
  const name = part.type.replace("tool-", "");
  const state = part.state;
  const output = part.output;
  const input = part.input;
  const label = name.replace(/_/g, " ");

  return (
    <Card className="p-3 bg-secondary/30 border-secondary text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs capitalize">
          {label}
        </Badge>
        <span className="text-xs text-muted-foreground">{state}</span>
      </div>
      {name === "segment_customers" && output && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-semibold text-primary">{output.count}</span> matching customers
          </div>
          {output.sample_customers?.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {output.sample_customers.slice(0, 3).map((c: any) => (
                <li key={c.id}>
                  · {c.name} — {c.city} · {c.total_orders} orders · ₹
                  {Number(c.total_spent).toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {name === "preview_campaign" && output?.previews && (
        <div className="space-y-1.5">
          {output.previews.slice(0, 3).map((p: any, i: number) => {
            const Icon = channelIcons[p.channel] ?? MessageCircle;
            return (
              <div key={i} className="text-xs bg-card p-2 rounded border">
                <div className="font-medium flex items-center gap-1.5">
                  <Icon className="size-3" />
                  {p.customer_name}
                </div>
                <div className="text-muted-foreground mt-0.5">{p.personalised_message}</div>
              </div>
            );
          })}
        </div>
      )}
      {name === "launch_campaign" && output && (
        <div className="text-sm">
          ✅ Launched <span className="font-semibold">{output.total_recipients}</span> messages
          {output.channels && <> across {output.channels.join(", ")}</>}.{" "}
          <Link
            to="/campaigns/$id"
            params={{ id: output.campaign_id }}
            className="text-primary underline"
          >
            View live message flow →
          </Link>
        </div>
      )}
      {name === "get_campaign_stats" && output && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="Sent" v={output.sent} />
          <Stat label="Delivered" v={output.delivered} />
          <Stat label="Opened" v={output.opened} />
          <Stat label="Clicked" v={output.clicked} />
          <Stat label="Ordered" v={output.ordered ?? 0} />
          <Stat label="Failed" v={output.failed ?? 0} />
          <Stat label="Open rate" v={`${output.open_rate}%`} />
          <Stat label="Click rate" v={`${output.click_rate}%`} />
          <Stat label="Order rate" v={`${output.order_rate ?? 0}%`} />
        </div>
      )}
      {!output && input && (
        <pre className="text-xs text-muted-foreground overflow-x-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </Card>
  );
}

function Stat({ label, v }: { label: string; v: any }) {
  return (
    <div className="bg-card p-2 rounded border">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold text-base">{v}</div>
    </div>
  );
}
