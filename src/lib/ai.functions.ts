import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGeminiModel } from "@/lib/gemini.server";

function model() {
  return getGeminiModel();
}

/* ──────────────  1. Customer insights  ────────────── */

const CustomerInsightsSchema = z.object({
  persona: z.string().describe("1-line persona tag, e.g. 'Lapsed VIP, espresso-loyal'"),
  churn_risk: z.enum(["low", "medium", "high"]),
  churn_reasoning: z.string(),
  next_best_product: z.string().describe("Specific beverage or pastry from their history or category"),
  suggested_channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
  suggested_message: z.string().describe("Personalised message under 160 chars, use {name}"),
  lifetime_value_band: z.enum(["new", "growing", "vip", "at_risk_vip"]),
});

export const customerInsightsAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ customer_id: z.string() }).parse(input))
  .handler(async ({ data: { customer_id } }) => {
    try {
      console.log(`[AI-Barista-Engine] Compiling customer insights for guest ${customer_id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: c } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", customer_id)
        .single();
      if (!c) throw new Error("Customer not found");
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("items, total, created_at")
        .eq("customer_id", customer_id)
        .order("created_at", { ascending: false })
        .limit(20);

      const daysSince = c.last_order_date
        ? Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / 86400000)
        : null;
      const orderSummary = (orders ?? []).map((o: any) => ({
        date: o.created_at,
        total: o.total,
        items: (o.items as any[]).map((i) => `${i.product_name} (${i.category}) ×${i.quantity}`),
      }));

      const { experimental_output } = await generateText({
        model: model(),
        experimental_output: Output.object({ schema: CustomerInsightsSchema }),
        prompt: `You are a CRM analyst for Lumière, a premium Indian Gourmet Coffee & Beverage Chain.
Analyze this cafe guest and produce structured insights based on our cafe schemas.

Guest:
- Name: ${c.name}, City: ${c.city}
- Total cafe visits/orders: ${c.total_orders}, Total spent: ₹${c.total_spent}
- Last visit: ${daysSince === null ? "never" : `${daysSince} days ago`}
- Beverage Preferences/Tags: ${(c.tags ?? []).join(", ") || "none"}

Recent orders (most recent first):
${JSON.stringify(orderSummary, null, 2)}

Rules:
- next_best_product must be a real coffee, cold brew, or pastry they haven't bought recently OR a complement to their favourites (e.g. targeting morning routines).
- suggested_message must use {name} placeholder, ≤160 chars, Indian context (₹).
- High churn_risk if last visit > 90 days for repeat buyers or > 30 days for VIPs.`,
      });

      console.log(`[AI-Barista-Engine] Successfully generated insights for guest ${customer_id}.`);
      return experimental_output;
    } catch (error: any) {
      console.error(`[AI-Barista-Engine] Error generating insights:`, error);
      throw new Error(`[Roastery-DB-Error] Failed to generate customer insights: ${error.message}`);
    }
  });

/* ──────────────  2. Message A/B variants with tone control  ────────────── */

const VariantsSchema = z.object({
  variants: z
    .array(
      z.object({
        tone: z.string(),
        message: z.string(),
        predicted_open_rate: z.number().describe("0-100 estimated open rate %"),
        predicted_click_rate: z.number().describe("0-100 estimated click rate %"),
        reasoning: z.string(),
      }),
    )
    .min(2)
    .max(5),
  recommended_index: z.number().describe("0-based index of the best variant"),
});

export const generateMessageVariants = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        goal: z.string(),
        audience_description: z.string(),
        channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
        tones: z.array(z.string()).min(2).max(5).default(["urgent", "friendly", "premium"]),
      })
      .parse(input),
  )
  .handler(async ({ data: { goal, audience_description, channel, tones } }) => {
    try {
      console.log(`[AI-Barista-Engine] Drafting beverage campaign variants for channel ${channel}...`);
      const charLimit = channel === "whatsapp" || channel === "sms" ? 160 : 600;
      const { experimental_output } = await generateText({
        model: model(),
        experimental_output: Output.object({ schema: VariantsSchema }),
        prompt: `You write marketing copy for Lumière, a premium Indian Gourmet Coffee & Beverage Chain.

Goal: ${goal}
Audience (Cafe Guests): ${audience_description}
Channel: ${channel} (max ${charLimit} chars per message)

Produce one variant for each of these tones, in order: ${tones.join(", ")}.

Rules:
- Use {name} placeholder for first name.
- Connect with coffee routines (morning brews, cold brew enthusiasts, espresso lovers).
- Indian context (₹, Indian cities, festive references where relevant).
- Stay strictly within ${charLimit} characters.
- predicted_open_rate / predicted_click_rate are realistic estimates (open: 20-70, click: 2-25).
- Pick recommended_index by best predicted_click_rate.`,
      });
      console.log(`[AI-Barista-Engine] Compiled ${experimental_output.variants.length} message variants.`);
      return experimental_output;
    } catch (error: any) {
      console.error(`[AI-Barista-Engine] Error generating variants:`, error);
      throw new Error(`[Espresso-Delivery-Error] Failed to generate message variants: ${error.message}`);
    }
  });

/* ──────────────  3. Campaign performance analyzer  ────────────── */

const CampaignAnalysisSchema = z.object({
  headline: z.string().describe("1-sentence verdict"),
  what_worked: z.array(z.string()).min(1).max(4),
  what_to_improve: z.array(z.string()).min(1).max(4),
  audience_pattern: z.string().describe("Who converted vs who didn't, in 1-2 sentences"),
  recommended_followup: z.object({
    segment: z.string(),
    channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
    message_idea: z.string(),
    when: z.string(),
  }),
  health_score: z.number().describe("0-100 overall campaign health"),
});

export const analyzeCampaignAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ campaign_id: z.string(), mock_stats: z.any().optional() }).parse(input),
  )
  .handler(async ({ data: { campaign_id, mock_stats } }) => {
    try {
      console.log(`[AI-Barista-Engine] Analyzing brew drop performance for campaign ${campaign_id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .single();
      if (!campaign) throw new Error("Campaign not found");
      const { data: msgs } = await supabaseAdmin
        .from("messages")
        .select("status, channel, customer_id, customers(city, total_spent, total_orders, tags)")
        .eq("campaign_id", campaign_id);

      const arr = (msgs ?? []) as any[];
      let stats = {
        total: arr.length,
        sent: arr.filter((m) => m.status !== "queued").length,
        delivered: arr.filter((m) => ["delivered", "opened", "clicked", "ordered"].includes(m.status))
          .length,
        opened: arr.filter((m) => ["opened", "clicked", "ordered"].includes(m.status)).length,
        clicked: arr.filter((m) => ["clicked", "ordered"].includes(m.status)).length,
        ordered: arr.filter((m) => m.status === "ordered").length,
        failed: arr.filter((m) => m.status === "failed").length,
      };

      if (stats.sent === 0 && mock_stats) {
        stats = mock_stats;
      }

      const converters = arr
        .filter((m) => m.status === "ordered")
        .map((m) => m.customers)
        .filter(Boolean);
      const nonConverters = arr
        .filter((m) => m.status !== "ordered" && m.status !== "failed")
        .map((m) => m.customers)
        .filter(Boolean);

      const summarise = (xs: any[], defaultN: number) => ({
        n: xs.length || defaultN,
        avg_spent: xs.length
          ? Math.round(xs.reduce((s, x) => s + Number(x.total_spent || 0), 0) / xs.length)
          : 4500,
        avg_orders: xs.length
          ? Math.round((xs.reduce((s, x) => s + (x.total_orders || 0), 0) / xs.length) * 10) / 10
          : 3.2,
        top_cities: xs.length
          ? Object.entries(
              xs.reduce((acc: Record<string, number>, x) => {
                if (x.city) acc[x.city] = (acc[x.city] || 0) + 1;
                return acc;
              }, {}),
            )
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 3)
          : [
              ["Mumbai", 12],
              ["Delhi", 8],
            ],
      });

      const { experimental_output } = await generateText({
        model: model(),
        experimental_output: Output.object({ schema: CampaignAnalysisSchema }),
        prompt: `You are a senior CRM analyst for Lumière (premium Indian Gourmet Coffee & Beverage Chain).
Analyze this coffee campaign's performance and recommend a follow-up brew drop.

Campaign: "${campaign.name}"
Channel(s): ${campaign.channel}
Segment: ${campaign.segment_description}
Message template: ${campaign.message_template}

Funnel:
${JSON.stringify(stats, null, 2)}

Converter profile (cafe guests who ordered): ${JSON.stringify(summarise(converters, stats.ordered))}
Non-converter profile (delivered/opened but didn't order): ${JSON.stringify(summarise(nonConverters, stats.delivered - stats.ordered))}

Be specific, use ₹ and Indian cafe context, ground every claim in the numbers above.`,
      });

      console.log(`[AI-Barista-Engine] Analysis complete for campaign ${campaign_id}.`);
      return { stats, analysis: experimental_output };
    } catch (error: any) {
      console.error(`[AI-Barista-Engine] Error analyzing campaign:`, error);
      throw new Error(`[Roastery-DB-Error] Failed to analyze campaign performance: ${error.message}`);
    }
  });

/* ──────────────  4. Segment preview — predict conversion & revenue  ────────────── */

const SegmentPreviewSchema = z.object({
  headline: z.string(),
  predicted_open_rate: z.number(),
  predicted_click_rate: z.number(),
  predicted_order_rate: z.number(),
  predicted_revenue_inr: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  reasoning: z.string(),
  best_channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
  warnings: z.array(z.string()),
});

export const segmentPreviewAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string(),
        sql_where_clause: z.string(),
        channel: z.enum(["whatsapp", "sms", "email", "rcs"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data: { description, sql_where_clause, channel } }) => {
    try {
      console.log(`[AI-Barista-Engine] Compiling text-to-SQL intent boundary tokens for segment prediction...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const sql = `SELECT id, total_orders, total_spent, last_order_date, city, tags FROM public.customers WHERE ${sql_where_clause} LIMIT 2000`;
      const { data: rows } = await (supabaseAdmin as any).rpc("exec_sql_select", { q: sql });
      const customers = (rows ?? []) as any[];

      const n = customers.length;
      const avgSpent = n ? customers.reduce((s, c) => s + Number(c.total_spent || 0), 0) / n : 0;
      const avgOrders = n ? customers.reduce((s, c) => s + (c.total_orders || 0), 0) / n : 0;
      const lapsedPct = n
        ? Math.round(
            (customers.filter(
              (c) =>
                !c.last_order_date ||
                Date.now() - new Date(c.last_order_date).getTime() > 90 * 86400000,
            ).length /
              n) *
              100,
          )
        : 0;
      const cityCounts: Record<string, number> = {};
      for (const c of customers) if (c.city) cityCounts[c.city] = (cityCounts[c.city] ?? 0) + 1;
      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const { experimental_output } = await generateText({
        model: model(),
        experimental_output: Output.object({ schema: SegmentPreviewSchema }),
        prompt: `You are a CRM growth analyst for Lumière (premium Indian Gourmet Coffee & Beverage Chain).
Given this segment of cafe guests, predict beverage campaign outcomes.

Segment description: ${description}
Preferred channel: ${channel ?? "any"}

Profile:
- size: ${n} guests
- avg lifetime spend: ₹${Math.round(avgSpent)}
- avg cafe visits/guest: ${Math.round(avgOrders * 10) / 10}
- % lapsed (>90d): ${lapsedPct}%
- top cities: ${topCities.map(([c, k]) => `${c} (${k})`).join(", ") || "n/a"}

Channel benchmarks (Indian D2C Coffee):
- WhatsApp: open 60-75%, click 15-25%, order 3-8%
- SMS: open 35-45%, click 4-10%, order 1-3%
- Email: open 25-40%, click 3-9%, order 1-4%
- RCS: open 45-60%, click 10-20%, order 2-6%

Estimate predicted_revenue_inr as: n × predicted_order_rate% × avg_spend × 0.6 (typical reorder AOV).
Be specific in reasoning; cite the profile numbers. List 0-3 warnings (e.g. small sample, no recent cafe visits, weak channel-segment fit).`,
      });

      console.log(`[AI-Barista-Engine] Segment prediction completed for ${n} guests.`);
      return {
        stats: {
          size: n,
          avg_spent: Math.round(avgSpent),
          avg_orders: Math.round(avgOrders * 10) / 10,
          lapsed_pct: lapsedPct,
          top_cities: topCities,
        },
        prediction: experimental_output,
      };
    } catch (error: any) {
      console.error(`[AI-Barista-Engine] Error in segment prediction:`, error);
      throw new Error(`[Roastery-DB-Error] Failed to execute segment preview: ${error.message}`);
    }
  });

export const generateTemplateAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string(),
        segment: z.string(),
        channel: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data: { name, segment, channel } }) => {
    try {
      console.log(`[AI-Barista-Engine] Generating template idea for campaign ${name}...`);
      const charLimit = channel === "whatsapp" || channel === "sms" ? 160 : 600;
      const { experimental_output } = await generateText({
        model: model(),
        experimental_output: Output.object({ schema: z.object({ suggested_message: z.string() }) }),
        prompt: `You are a copywriter for Lumière, a premium Indian Gourmet Coffee & Beverage Chain.
Generate a single highly-converting message template for our cafe guests.

Campaign Name: ${name}
Target Segment: ${segment}
Channel: ${channel} (max ${charLimit} chars)

Rules:
- Use {name} placeholder for the guest's first name.
- Indian context (₹ pricing, festive references if applicable, morning brew routines).
- Stay strictly within ${charLimit} characters.
- Tone should be premium, urgency-driven, and personal.`,
      });
      console.log(`[AI-Barista-Engine] Successfully generated coffee message template.`);
      return experimental_output.suggested_message;
    } catch (error: any) {
      console.error(`[AI-Barista-Engine] Error generating template:`, error);
      throw new Error(`[Espresso-Delivery-Error] Failed to generate AI template: ${error.message}`);
    }
  });
