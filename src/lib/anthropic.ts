/**
 * Claude AI Assistant Configuration and Tool Definitions.
 *
 * This file contains the instructions and tool declarations for the AI assistant.
 * Below is an explanation of the 5 core tools available to the assistant:
 *
 * 1. segment_customers: Queries the CRM customer database using a generated Postgres SQL WHERE clause
 *    based on user constraints (e.g. VIP status, city, or past order categories).
 * 2. draft_message: Generates a template copy for the target channel (WhatsApp, SMS, Email, RCS)
 *    with personalization tags like {name} and {city}.
 * 3. preview_campaign: Renders mock personalized message previews for a small subset of target customers.
 * 4. launch_campaign: Creates the campaign entry in the CRM database, inserts queued messages, and dispatches them.
 * 5. get_campaign_stats: Fetches live delivery status metrics (sent, delivered, opened, clicked, ordered, failed).
 */

import { tool } from "ai";
import { z } from "zod";

export const BASE_SYSTEM_PROMPT = `You are Lumière's AI marketing assistant. You help the marketer run personalised campaigns for Lumière, a premium D2C skincare brand based in India.

You have access to a customer database with hundreds of customers and their full purchase history. You can segment customers, draft messages, preview campaigns, launch campaigns, and fetch performance stats.

Database schema (Postgres):
- customers (id uuid, name, email, phone, city, tags text[], total_orders int, total_spent numeric, last_order_date timestamptz, created_at timestamptz)
- orders (id, customer_id, items jsonb [{product_id, product_name, category, price, quantity}], total numeric, created_at)
- products (id, name, category, price)

When building SQL WHERE clauses for segment_customers, use ONLY the public.customers table. For order-related conditions, you can use subqueries against public.orders. Examples:
- VIP: total_orders >= 5 AND total_spent >= 8000
- Lapsed: last_order_date < now() - interval '90 days'
- Bought cold brews never pastries: id IN (SELECT customer_id FROM orders WHERE items::text ILIKE '%"category": "espresso"%') AND id NOT IN (SELECT customer_id FROM orders WHERE items::text ILIKE '%"category": "pastry"%')
- Mumbai customers: city = 'Mumbai'

Use Indian context: ₹ for currency, Indian cities, festive references (Diwali, Holi, Raksha Bandhan). Be conversational but efficient. Use markdown for clarity.`;

export const EXECUTOR_INSTRUCTIONS = `
YOUR ROLE: Autonomous CRM Executor
You specialize in running the full marketing pipeline: segmenting, copywriting, previewing, and launching.

Workflow:
1) Call segment_customers to find recipients (always state the exact count).
2) Draft a personalised message (use {name} and {city} placeholders). WhatsApp/SMS under 160 chars. Email can be longer.
3) Ask the user which channel(s) to use — WhatsApp, SMS, Email, RCS — and confirm if they want multiple. The user may pick more than one; each recipient gets one message per chosen channel.
4) Call preview_campaign with the chosen channels to show 5 examples.
5) ALWAYS ask the user to confirm before calling launch_campaign. Pass channels as an array even if there is only one.
6) After launch, you may call get_campaign_stats to summarise. Tell the user they can open the campaign page to see a live event flow for every individual message.

When you have all info to draft a campaign, present a SUMMARY (segment, count, channel(s), message draft, sample previews) and explicitly ask "Shall I launch this?" — wait for the user's yes before launching.`;

export const ANALYST_INSTRUCTIONS = `
YOUR ROLE: Analytical Database Oracle
You specialize in data intelligence, customer cohorts, campaign ROI, and database statistics.

Focus:
1) Write SQL WHERE clauses to filter cohorts precisely.
2) Summarize and compare customer segments (e.g. by orders, cities, active tags).
3) Calculate ROI metrics when requested using campaign_roi or campaign_stats.
4) Highlight interesting patterns (e.g., top buying cities, average spend by category).
5) When outputting tables or lists, use clean markdown tables. Focus on providing quantitative insights.`;

export const COPYWRITER_INSTRUCTIONS = `
YOUR ROLE: Creative Marketing Copywriter
You specialize in message composition, copywriting hooks, A/B testing, and emotional branding.

Focus:
1) Generate message variants in different tones (e.g. witty, luxury, urgent, friendly) using generate_message_variants.
2) Ensure all messages contain correct personalisation tags ({name}, {city}) and look polished.
3) Focus on brand aesthetics: we are "Lumière", a premium beauty/skincare brand. The copy should feel high-end, elegant, and appealing.
4) Help the user refine their marketing pitches, email subjects, or SMS calls-to-action.`;

export const tools = {
  segment_customers: tool({
    description:
      "Query the customer database to find customers matching specific criteria. Pass a Postgres WHERE clause (without the WHERE keyword) that references the public.customers table.",
    inputSchema: z.object({
      description: z.string().describe("Human-readable description of who this segment targets"),
      sql_where_clause: z
        .string()
        .describe('Postgres WHERE clause body, e.g. "total_orders >= 5 AND total_spent >= 8000"'),
    }),
    execute: async ({ description, sql_where_clause }) => {
      // At the segment_customers tool execution:
      // The LLM parses natural language input from the user (e.g. "customers in Mumbai who bought dark roasts")
      // and dynamically converts those criteria into a valid SQL WHERE clause (e.g. "city = 'Mumbai' AND id IN (...)").
      // This WHERE clause is then run against the Supabase database to fetch matching records.
      const { segmentCustomers } = await import("@/lib/crm.functions");
      return await segmentCustomers({ data: { description, sql_where_clause } });
    },
  }),
  draft_message: tool({
    description:
      "Return a drafted personalised message for the given audience and channel. Use {name} and {city} placeholders.",
    inputSchema: z.object({
      goal: z.string(),
      channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
      audience_description: z.string(),
      tone: z.string().optional(),
    }),
    execute: async ({ goal, channel, audience_description, tone }) => {
      return {
        ok: true,
        guidance: `Draft a ${tone ?? "warm, premium"} ${channel} message for ${audience_description}. Goal: ${goal}. Use {name} for personalisation. ${channel === "whatsapp" || channel === "sms" ? "Keep under 160 chars." : ""}`,
      };
    },
  }),
  preview_campaign: tool({
    description:
      "Show personalised message previews for 5 sample customers across the selected channels.",
    inputSchema: z.object({
      message_template: z.string(),
      customer_ids: z.array(z.string()),
      channels: z.array(z.enum(["whatsapp", "sms", "email", "rcs"])).min(1),
    }),
    execute: async (args) => {
      const { previewCampaign } = await import("@/lib/crm.functions");
      return await previewCampaign({ data: args });
    },
  }),
  launch_campaign: tool({
    description:
      "Create and launch the campaign — enqueues a message per recipient per selected channel. ALWAYS confirm channels and copy with the user before calling this.",
    inputSchema: z.object({
      name: z.string(),
      segment_description: z.string(),
      sql_where_clause: z.string(),
      message_template: z.string(),
      channels: z
        .array(z.enum(["whatsapp", "sms", "email", "rcs"]))
        .min(1)
        .describe("One or more channels. Each recipient gets one message per channel."),
      customer_ids: z.array(z.string()).optional(),
    }),
    execute: async (args) => {
      const { launchCampaign } = await import("@/lib/crm.functions");
      return await launchCampaign({ data: args });
    },
  }),
  get_campaign_stats: tool({
    description: "Get live performance statistics for a campaign.",
    inputSchema: z.object({ campaign_id: z.string() }),
    execute: async ({ campaign_id }) => {
      const { getCampaignStats } = await import("@/lib/crm.functions");
      return await getCampaignStats({ data: { campaign_id } });
    },
  }),
  analyze_campaign: tool({
    description:
      "AI-analyze a campaign's results: what worked, what to improve, recommended follow-up. Use after launch.",
    inputSchema: z.object({ campaign_id: z.string() }),
    execute: async ({ campaign_id }) => {
      const { analyzeCampaignAi } = await import("@/lib/ai.functions");
      return await analyzeCampaignAi({ data: { campaign_id } });
    },
  }),
  generate_message_variants: tool({
    description:
      "Produce 2-5 message variants in different tones with predicted open/click rates. Use before preview_campaign when the user wants A/B options or tone control.",
    inputSchema: z.object({
      goal: z.string(),
      audience_description: z.string(),
      channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
      tones: z.array(z.string()).min(2).max(5),
    }),
    execute: async (args) => {
      const { generateMessageVariants } = await import("@/lib/ai.functions");
      return await generateMessageVariants({ data: args });
    },
  }),
  customer_insights: tool({
    description:
      "AI profile of a single customer: persona, churn risk, next-best product, suggested message.",
    inputSchema: z.object({ customer_id: z.string() }),
    execute: async ({ customer_id }) => {
      const { customerInsightsAi } = await import("@/lib/ai.functions");
      return await customerInsightsAi({ data: { customer_id } });
    },
  }),
  segment_preview: tool({
    description:
      "AI forecast for a segment before launching: predicted open/click/order rates, expected revenue in ₹, recommended channel, warnings. Call after segment_customers when the user wants a forecast.",
    inputSchema: z.object({
      description: z.string(),
      sql_where_clause: z.string(),
      channel: z.enum(["whatsapp", "sms", "email", "rcs"]).optional(),
    }),
    execute: async (args) => {
      const { segmentPreviewAi } = await import("@/lib/ai.functions");
      return await segmentPreviewAi({ data: args });
    },
  }),
  campaign_roi: tool({
    description:
      "Revenue, cost, profit, ROI multiple and per-channel breakdown for a launched campaign.",
    inputSchema: z.object({ campaign_id: z.string() }),
    execute: async ({ campaign_id }) => {
      const { getCampaignRoi } = await import("@/lib/crm.functions");
      return await getCampaignRoi({ data: { campaign_id } });
    },
  }),
};
