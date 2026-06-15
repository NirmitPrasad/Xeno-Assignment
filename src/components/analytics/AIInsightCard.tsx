import React from "react";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InsightItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/10 transition-colors">
      <Lightbulb className="size-4 text-amber-500 mt-0.5 shrink-0" />
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{text}</p>
    </div>
  );
}

export function AIInsightCard({
  insights,
  isLoading,
  onRefresh,
  refreshing,
}: {
  insights?: string[];
  isLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const hasData = insights && insights.length > 0;
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <Sparkles className="size-4 text-indigo-500 shrink-0" />
            AI Insights
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-8"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`size-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex-1 mt-6 space-y-4">
        {isLoading ? (
          <span className="text-xs text-muted-foreground block text-center mt-12">
            Analyzing database...
          </span>
        ) : hasData ? (
          insights.map((text, idx) => <InsightItem key={idx} text={text} />)
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-48 py-4 px-2">
            <Lightbulb className="size-8 text-amber-400 mb-2 shrink-0 animate-bounce" />
            <span className="text-xs text-slate-500 font-medium">Insights Unavailable</span>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
              Seed database with customer orders to generate actionable insights.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
