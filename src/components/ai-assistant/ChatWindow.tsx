import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  TrendingUp,
  Lightbulb,
  CalendarDays,
  Zap,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { SuggestedPrompts } from "@/components/ai-assistant/SuggestedPrompts";
import { MessageBubble } from "@/components/ai-assistant/MessageBubble";

const SALES_TIPS = [
  {
    icon: "💬",
    title: "WhatsApp beats email by 3×",
    body: "For flash sales and festive drops, WhatsApp messages get 40% higher click-through rates than email. Lead with WhatsApp, follow up on email.",
  },
  {
    icon: "⏰",
    title: "Send at 8–10 PM IST",
    body: "Customers in India check phones most between 8–10 PM. Schedule WhatsApp blasts in this window for up to 2× higher open rates.",
  },
  {
    icon: "👑",
    title: "VIPs buy 5× more on exclusives",
    body: "Customers tagged as VIP respond strongly to 'early access' framing. Try messaging them 24 hrs before a public sale goes live.",
  },
  {
    icon: "🔁",
    title: "Win-back within 90 days",
    body: "Lapsed customers who last bought within 90 days are 4× easier to re-engage than those who've been gone longer. Target them first.",
  },
  {
    icon: "🎁",
    title: "Bundle = higher AOV",
    body: "Suggest a cold brew + pastry bundle to single-product buyers. Bundle campaigns average 35% higher average order value.",
  },
  {
    icon: "📍",
    title: "City-personalised messages",
    body: "Using {city} in your message template (e.g. 'Hey {name}, Mumbaikars are loving this…') lifts engagement by 18% on average.",
  },
  {
    icon: "📊",
    title: "Festive = 60% revenue spike",
    body: "Diwali, Holi, Raksha Bandhan windows drive 60% of annual revenue for D2C beverage brands. Plan campaigns 7 days in advance.",
  },
  {
    icon: "🧪",
    title: "A/B your subject lines",
    body: "Test 2 copy variants (e.g. luxury vs urgent tone) on 10% of your list before full blast. The winner gets 25–40% better results.",
  },
];

const SEGMENT_PLAYS = [
  {
    label: "🚨 High-value lapsed",
    desc: "VIPs inactive 60+ days",
    prompt:
      "Find our VIP customers (5+ orders, ₹8000+ spent) who haven't bought in the last 60 days and draft a WhatsApp win-back offer",
    potential: "₹40k+ potential",
  },
  {
    label: "🌱 First-timers",
    desc: "Bought once, never returned",
    prompt:
      "Segment customers who placed exactly one order more than 30 days ago but never came back, and draft a nurture email",
    potential: "Loyalty building",
  },
  {
    label: "🔁 Cross-sell cold brews",
    desc: "Bought cold brew, not pastry",
    prompt:
      "Segment customers who bought cold brews but never tried pastries and create a bundle promotion",
    potential: "AOV +35%",
  },
  {
    label: "🏙️ City blitz — Mumbai",
    desc: "Biggest metro, underserved",
    prompt:
      "Find all customers in Mumbai who haven't received a campaign in the last 30 days and send them a personalised offer",
    potential: "High density",
  },
];

const FESTIVAL_CALENDAR = [
  {
    name: "Raksha Bandhan",
    date: "Aug 9",
    daysLeft: 58,
    idea: "Gift kits for sisters — iced latte + brownie bundle",
  },
  {
    name: "Onam",
    date: "Sep 5",
    daysLeft: 85,
    idea: "Kerala customers — regional personalisation works well",
  },
  {
    name: "Navratri",
    date: "Oct 2",
    daysLeft: 112,
    idea: "9-day brew series — one featured roast per day",
  },
  {
    name: "Diwali",
    date: "Oct 20",
    daysLeft: 130,
    idea: "Biggest revenue window — VIP early access + gifting",
  },
];

export function ChatWindow({ initialMsg }: { initialMsg?: string }) {
  const [input, setInput] = useState(initialMsg ?? "");
  const [mode, setMode] = useState<"executor" | "analyst" | "copywriter">("executor");

  const { messages, sendMessage, status, error } = useChat(mode, (e) => {
    const msg = e.message ?? "";
    if (
      msg.includes("quota") ||
      msg.includes("rate") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("exceeded")
    ) {
      toast.error(
        "API quota exceeded. Get a free key at aistudio.google.com/apikey and update GEMINI_API_KEY in your .env file.",
        { duration: 8000 },
      );
    } else if (msg.includes("not found") || msg.includes("not supported")) {
      toast.error(
        "AI model unavailable. Set GEMINI_MODEL in .env (e.g. gemini-2.5-flash) and restart the dev server.",
        { duration: 6000 },
      );
    } else {
      toast.error(msg.slice(0, 120) || "AI request failed.");
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
  };

  const [tipIndex, setTipIndex] = useState(0);

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden flex-1">
      <header className="px-6 py-3 border-b flex items-center justify-between bg-card shrink-0">
        <div>
          <h1 className="text-md font-semibold tracking-tight">AI Barista Copilot</h1>
          <p className="text-[11px] text-muted-foreground">
            Powered by Gemini · Ask to segment, draft, preview, launch.
          </p>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="bg-card/45 border-b px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Assistant Persona:
          </span>
          <div className="inline-flex p-0.5 bg-secondary/40 rounded-lg border gap-0.5">
            <button
              onClick={() => setMode("executor")}
              className={`px-2.5 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                mode === "executor"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              ⚡ Executor
            </button>
            <button
              onClick={() => setMode("analyst")}
              className={`px-2.5 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                mode === "analyst"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              📊 Analyst
            </button>
            <button
              onClick={() => setMode("copywriter")}
              className={`px-2.5 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                mode === "copywriter"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              ✍️ Copywriter
            </button>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground hidden md:block italic">
          {mode === "executor" && "Segment clients, build templates & dispatch blasts."}
          {mode === "analyst" && "Calculate metrics, query cohort spend & view trends."}
          {mode === "copywriter" && "Generate messaging hooks, tone options & templates."}
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden border-r">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <SuggestedPrompts mode={mode} onPick={(p) => handleSubmit(p)} />
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5 animate-pulse text-gold" /> Thinking…
                </div>
              )}
              {error && <div className="text-xs text-destructive">{error.message}</div>}
            </div>
          </div>

          <div className="border-t bg-card p-3 shrink-0">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex gap-2 items-end"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={
                    mode === "executor"
                      ? "Ask Xeno to segment customers, draft WhatsApp or launch campaigns..."
                      : mode === "analyst"
                        ? "Query statistics, calculate spend metrics or run ROI checks..."
                        : "Write A/B testing copy, create newsletter subject lines or change copy tones..."
                  }
                  rows={2}
                  className="flex-1 resize-none text-xs"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary h-10 px-3"
                >
                  <Send className="size-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Revenue Intelligence Panel */}
        <RevenuePanel
          onAsk={handleSubmit}
          tipIndex={tipIndex}
          onNextTip={() => setTipIndex((i) => (i + 1) % SALES_TIPS.length)}
        />
      </div>
    </div>
  );
}

function RevenuePanel({
  onAsk,
  tipIndex,
  onNextTip,
}: {
  onAsk: (p: string) => void;
  tipIndex: number;
  onNextTip: () => void;
}) {
  const tip = SALES_TIPS[tipIndex];
  return (
    <div className="w-80 shrink-0 bg-card/10 hidden xl:flex flex-col border-l overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
          <TrendingUp className="size-3.5 text-amber-500" />
          Revenue Intelligence
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          AI-powered ideas to drive more sales from your customers.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
        {/* Rotating Sales Tip */}
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Lightbulb className="size-3 text-amber-500" /> Sales Tip
            </span>
            <button
              onClick={onNextTip}
              className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="size-2.5" />
              <span className="text-[9px]">next</span>
            </button>
          </div>
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 space-y-1">
            <div className="text-sm">
              {tip.icon}{" "}
              <span className="font-semibold text-[11px] text-foreground">{tip.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{tip.body}</p>
          </div>
        </div>

        {/* Smart Segment Plays */}
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <Zap className="size-3 text-indigo-500" /> Quick-Win Segments
          </div>
          <div className="space-y-1.5">
            {SEGMENT_PLAYS.map((play) => (
              <button
                key={play.label}
                onClick={() => onAsk(play.prompt)}
                className="w-full text-left border rounded-xl p-2.5 hover:border-primary hover:bg-accent/30 transition-all group bg-card/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[11px] text-foreground">{play.label}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{play.desc}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold">
                      {play.potential}
                    </div>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors ml-auto mt-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Festival Campaign Calendar */}
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <CalendarDays className="size-3 text-rose-500" /> Festival Playbook
          </div>
          <div className="space-y-1.5">
            {FESTIVAL_CALENDAR.map((f) => (
              <button
                key={f.name}
                onClick={() =>
                  onAsk(
                    `Plan a campaign for ${f.name} (${f.date}) targeting our customers. Idea: ${f.idea}. Start with segmenting the best audience.`,
                  )
                }
                className="w-full text-left border rounded-xl p-2.5 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group bg-card/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[11px] text-foreground">{f.name}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{f.idea}</div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <div className="text-[9px] font-bold text-rose-500">{f.date}</div>
                    <div className="text-[9px] text-muted-foreground">{f.daysLeft}d left</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Best Practices Strip */}
        <div className="space-y-1.5">
          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <Sparkles className="size-3 text-primary" /> Proven Playbooks
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              {
                emoji: "🎯",
                label: "VIP Early Access",
                prompt:
                  "Send an exclusive early access WhatsApp to our VIP customers (5+ orders) for a new product launch",
              },
              {
                emoji: "💎",
                label: "Loyalty Upsell",
                prompt:
                  "Find customers who spent ₹3000–₹8000 total and send a loyalty upgrade offer to make them VIP",
              },
              {
                emoji: "📦",
                label: "Bundle Promo",
                prompt:
                  "Find single-product buyers and suggest a cold brew + pastry bundle with a 10% discount",
              },
              {
                emoji: "🌙",
                label: "Restock Alert",
                prompt:
                  "Draft a WhatsApp restock alert for customers who last bought our signature espresso more than 45 days ago",
              },
            ].map((pb) => (
              <button
                key={pb.label}
                onClick={() => onAsk(pb.prompt)}
                className="flex flex-col items-start gap-1 border rounded-lg p-2 hover:border-primary hover:bg-accent/30 transition-all bg-card/30 text-left group"
              >
                <span className="text-base">{pb.emoji}</span>
                <span className="text-[10px] font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                  {pb.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
