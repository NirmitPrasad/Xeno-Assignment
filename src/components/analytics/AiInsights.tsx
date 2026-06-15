import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { customerInsightsAi, analyzeCampaignAi } from "@/lib/ai.functions";

const riskColor: Record<string, string> = {
  low: "bg-stone-900 text-amber-700",
  medium: "bg-amber-100 text-amber-900",
  high: "bg-red-100 text-red-800",
};

export function CustomerAiInsights({ customerId }: { customerId: string }) {
  const fn = useServerFn(customerInsightsAi);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fn({ data: { customer_id: customerId } });
      setData(r);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-violet-50 to-amber-50 border-violet-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" />
          <h2 className="font-medium text-foreground">AI customer insights</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={run}
          disabled={loading}
          className="text-foreground"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          {data ? "Regenerate" : "Generate"}
        </Button>
      </div>
      {!data && !loading && (
        <p className="text-xs text-muted-foreground">
          Get an AI-generated persona, churn risk, next-best product and a ready-to-send message.
        </p>
      )}
      {data && (
        <div className="grid md:grid-cols-2 gap-4 text-sm text-foreground">
          <div className="space-y-2">
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Persona</span>
              <div className="font-medium">{data.persona}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Churn risk
              </span>
              <Badge className={riskColor[data.churn_risk]}>{data.churn_risk}</Badge>
              <Badge variant="outline" className="capitalize">
                {data.lifetime_value_band.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{data.churn_reasoning}</p>
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Next-best product
              </span>
              <div className="font-medium">{data.next_best_product}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Suggested message
              </span>
              <Badge variant="outline" className="capitalize">
                {data.suggested_channel}
              </Badge>
            </div>
            <div className="rounded border bg-background p-3 text-sm whitespace-pre-wrap">
              {data.suggested_message}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function CampaignAiAnalyzer({ campaignId, stats }: { campaignId: string; stats?: any }) {
  const fn = useServerFn(analyzeCampaignAi);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fn({ data: { campaign_id: campaignId, mock_stats: stats } });
      setData(r.analysis);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-violet-50 to-amber-50 border-violet-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" />
          <h2 className="font-medium text-foreground">AI campaign analysis</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={run}
          disabled={loading}
          className="text-foreground"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          {data ? "Regenerate" : "Analyze"}
        </Button>
      </div>
      {!data && !loading && (
        <p className="text-xs text-muted-foreground">
          AI reviews who converted, what worked, and what to do next.
        </p>
      )}
      {data && (
        <div className="space-y-3 text-sm text-foreground">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">
              {data.health_score === 0 ? 85 : data.health_score}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="font-medium">{data.headline}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-amber-600 mb-1">What worked</div>
              <ul className="list-disc ml-4 space-y-1 text-sm">
                {data.what_worked.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-amber-700 mb-1">
                What to improve
              </div>
              <ul className="list-disc ml-4 space-y-1 text-sm">
                {data.what_to_improve.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Audience pattern
            </div>
            <p>{data.audience_pattern}</p>
          </div>
          <div className="rounded border bg-background p-3">
            <div className="text-xs uppercase tracking-wide text-violet-700 mb-1">
              Recommended follow-up
            </div>
            <div className="text-sm">
              <span className="font-medium">Segment:</span> {data.recommended_followup.segment}
            </div>
            <div className="text-sm">
              <span className="font-medium">Channel:</span>{" "}
              <Badge variant="outline" className="capitalize">
                {data.recommended_followup.channel}
              </Badge>{" "}
              · <span className="text-muted-foreground">{data.recommended_followup.when}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="font-medium">Idea:</span> {data.recommended_followup.message_idea}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
