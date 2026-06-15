import React from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CHANNEL_COLOR } from "@/constants";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  channel: string;
  body: string;
  created_at: string;
}

interface TemplateCardProps {
  template: Template;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const t = template;
  const limit = t.channel === "sms" ? 160 : t.channel === "whatsapp" ? 1024 : null;

  return (
    <Card className="p-5 flex flex-col space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate text-foreground">{t.name}</div>
          {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
        </div>
        <Badge className={CHANNEL_COLOR[t.channel]}>{t.channel}</Badge>
      </div>
      <div className="text-sm bg-secondary/40 p-3 rounded border whitespace-pre-wrap flex-1 text-foreground">
        {t.body}
      </div>
      <div className="text-[10px] text-muted-foreground text-right mt-1">
        {t.body.length} {limit ? `/ ${limit} chars` : "chars (unlimited)"}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t mt-auto">
        <span>{format(new Date(t.created_at), "dd MMM yyyy")}</span>
        <div className="flex gap-1 items-center">
          <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
            <Link to="/chat" search={{ msg: t.body }}>
              <Send className="size-3 mr-1.5" /> Use in campaign
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(t.body);
              toast.success("Copied to clipboard!");
            }}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(t.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
