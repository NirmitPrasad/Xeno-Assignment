import React from "react";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CampaignComposer } from "@/components/campaigns/CampaignComposer";
import { ToolResultCard } from "@/components/ai-assistant/ToolResultCard";

interface MessageBubbleProps {
  message: any;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const text = (message.parts ?? [])
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("");
  const toolParts = (message.parts ?? []).filter((p: any) => p.type?.startsWith("tool-"));

  const segmentPart = toolParts.find((p: any) => p.type === "tool-segment_customers" && p.output);
  const launchedHere = toolParts.some((p: any) => p.type === "tool-launch_campaign" && p.output);
  const draftedMessage = (() => {
    const match = text.match(/"([^"]*\{name\}[^"]*)"/);
    return match?.[1];
  })();

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} w-full`}>
      {!isUser && (
        <div className="size-8 shrink-0 rounded-full lumiere-gradient flex items-center justify-center text-xs text-gold font-serif">
          X
        </div>
      )}
      <div
        className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : "items-start"} ${isUser ? "" : "w-full"}`}
      >
        {text &&
          (isUser ? (
            <div className="rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground whitespace-pre-wrap">
              {text}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-strong:text-foreground prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          ))}
        {toolParts.map((p: any, i: number) => (
          <ToolResultCard key={i} part={p} />
        ))}
        {!isUser && segmentPart && !launchedHere && segmentPart.output?.all_ids?.length > 0 && (
          <CampaignComposer
            defaultName={segmentPart.input?.description?.slice(0, 60) ?? "AI campaign"}
            segmentDescription={segmentPart.input?.description ?? "Segment"}
            sqlWhereClause={
              (segmentPart.output.sql_used ?? "")
                .replace(/^SELECT.*?WHERE\s+/i, "")
                .replace(/\s+LIMIT.*$/i, "") || "true"
            }
            allIds={segmentPart.output.all_ids}
            sampleCustomers={segmentPart.output.sample_customers ?? []}
            defaultMessage={draftedMessage}
          />
        )}
      </div>
    </div>
  );
}
