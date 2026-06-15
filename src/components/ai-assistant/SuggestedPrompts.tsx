import React from "react";
import { Sparkles } from "lucide-react";

const SUGGESTIONS_MAP = {
  executor: [
    "Find customers who haven't bought in 60 days and send a comeback offer on WhatsApp",
    "Send a Diwali offer to our VIP customers (5+ orders, ₹8000+ spent) on WhatsApp",
    "Segment customers who bought espresso but never tried pastries",
    "Draft a re-engagement email for lapsed customers in Mumbai",
  ],
  analyst: [
    "Calculate the total spend and count of customers from Mumbai",
    "Compare conversion and retention metrics for active vs. lapsed users",
    "Analyze the overall ROI and order rate of launched campaigns",
    "Show me the database breakdown of customer cities and total sales",
  ],
  copywriter: [
    "Generate 3 creative subject lines for a new cold brew launch",
    "Draft a luxury win-back WhatsApp text using {name} and {city}",
    "Write a friendly festival greeting promoting products under ₹1500",
    "Produce witty copy variants for iced latte promotion with predicted rates",
  ],
};

interface SuggestedPromptsProps {
  mode: "executor" | "analyst" | "copywriter";
  onPick: (prompt: string) => void;
}

export function SuggestedPrompts({ mode, onPick }: SuggestedPromptsProps) {
  const suggestions = SUGGESTIONS_MAP[mode] || SUGGESTIONS_MAP.executor;
  return (
    <div className="py-4 text-center space-y-4 max-w-2xl mx-auto">
      <div>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full lumiere-gradient text-primary-foreground mb-3 shadow-sm">
          <Sparkles className="size-5 text-gold animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
          Welcome to Coffee CRM
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-normal">
          {mode === "executor" && "Launch targeted marketing campaigns directly from chat."}
          {mode === "analyst" && "Query user cohorts, analyze ROI, and generate reports."}
          {mode === "copywriter" &&
            "Compose creative templates, copy variants, and personalized text."}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-left">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="p-3 border rounded-xl hover:border-primary hover:bg-accent/40 transition-all text-[11px] leading-relaxed cursor-pointer bg-card/20 hover:shadow-xs text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
