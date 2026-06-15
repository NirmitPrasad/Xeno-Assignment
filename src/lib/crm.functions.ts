import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Validate SQL where-clause is read-only-ish (basic guard)
function isSafeWhere(where: string) {
  const lower = where.toLowerCase();
  return !/(;|--|drop|alter|insert|update|delete|truncate|grant|create|copy)\b/.test(lower);
}

export const segmentCustomers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        description: z.string(),
        sql_where_clause: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data: { description, sql_where_clause } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Segmenting cafe guests...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      if (!isSafeWhere(sql_where_clause)) {
        return {
          error: "Unsafe SQL",
          count: 0,
          sample_customers: [],
          sql_used: sql_where_clause,
        };
      }
      const sql = `SELECT id, name, email, city, total_orders, total_spent, last_order_date, tags FROM public.customers WHERE ${sql_where_clause} LIMIT 1000`;
      const { data: rows, error } = await (supabaseAdmin as any).rpc("exec_sql_select", { q: sql });
      if (error) {
        // fallback: try simple WHERE on customers table via PostgREST (only supports column-level filters; here we just count all)
        return { error: error.message, count: 0, sample_customers: [], sql_used: sql };
      }
      const arr = (rows ?? []) as any[];
      console.log(`[Roastery-DB-Engine] Segmented ${arr.length} guests.`);
      return {
        count: arr.length,
        sample_customers: arr.slice(0, 5).map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          total_orders: c.total_orders,
          total_spent: c.total_spent,
        })),
        sql_used: sql,
        all_ids: arr.map((c) => c.id),
      };
    } catch (err: any) {
      console.error(`[Roastery-DB-Error] Error segmenting customers:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to segment customers: ${err.message}`);
    }
  });

export const previewCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        message_template: z.string(),
        customer_ids: z.array(z.string()),
        channels: z.array(z.string()).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data: { message_template, customer_ids, channels } }) => {
    try {
      console.log(`[AI-Barista-Engine] Compiling brew drop preview...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const ids = customer_ids.slice(0, 5);
      const { data: customers } = await supabaseAdmin
        .from("customers")
        .select("id, name, city")
        .in("id", ids);
      const previews: { customer_name: string; channel: string; personalised_message: string }[] = [];
      for (const c of customers ?? []) {
        for (const ch of channels) {
          previews.push({
            customer_name: c.name,
            channel: ch,
            personalised_message: personalise(message_template, c),
          });
        }
      }
      console.log(`[AI-Barista-Engine] Brew drop preview generated.`);
      return { previews, channels };
    } catch (err: any) {
      console.error(`[AI-Barista-Engine] Error previewing campaign:`, err);
      throw new Error(`[Espresso-Delivery-Error] Failed to preview brew drop: ${err.message}`);
    }
  });

function personalise(template: string, c: { name: string; city: string | null }) {
  return template
    .replace(/\{name\}/gi, c.name.split(" ")[0])
    .replace(/\{full_name\}/gi, c.name)
    .replace(/\{city\}/gi, c.city ?? "your city");
}

export const launchCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string(),
        segment_description: z.string(),
        sql_where_clause: z.string(),
        message_template: z.string(),
        channels: z.array(z.enum(["whatsapp", "sms", "email", "rcs"])).min(1),
        customer_ids: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data: { name, segment_description, sql_where_clause, message_template, channels, customer_ids } }) => {
    try {
      console.log(`[Espresso-Delivery] Broadcasting targeted brew drop to segment: ${name}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");

      let ids = customer_ids ?? [];
      if (ids.length === 0) {
        if (!isSafeWhere(sql_where_clause)) throw new Error("Unsafe SQL");
        const { data: rows } = await (supabaseAdmin as any).rpc("exec_sql_select", {
          q: `SELECT id FROM public.customers WHERE ${sql_where_clause} LIMIT 5000`,
        });
        ids = ((rows ?? []) as any[]).map((r) => r.id);
      }

      const channelLabel = channels.join(",");
      const totalRecipients = ids.length * channels.length;

      const { data: campaign, error: cErr } = await supabaseAdmin
        .from("campaigns")
        .insert({
          name,
          segment_query: sql_where_clause,
          segment_description,
          message_template,
          channel: channelLabel,
          status: "running",
          total_recipients: totalRecipients,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      if (ids.length > 0) {
        const { data: customers } = await supabaseAdmin
          .from("customers")
          .select("id, name, city")
          .in("id", ids);
        const messages: any[] = [];
        for (const c of customers ?? []) {
          for (const ch of channels) {
            messages.push({
              campaign_id: campaign.id,
              customer_id: c.id,
              personalised_text: personalise(message_template, c),
              channel: ch,
              status: "queued" as const,
            });
          }
        }
        for (let i = 0; i < messages.length; i += 200) {
          await supabaseAdmin.from("messages").insert(messages.slice(i, i + 200));
        }

        const { data: inserted } = await supabaseAdmin
          .from("messages")
          .select("id, channel, personalised_text")
          .eq("campaign_id", campaign.id);
        const { dispatchAndApply } = await import("@/lib/channel-service");
        await dispatchAndApply(supabaseAdmin, (inserted ?? []) as any);
      }

      await supabaseAdmin.from("campaigns").update({ status: "completed" }).eq("id", campaign.id);

      console.log(`[Espresso-Delivery] Brew drop ${name} completed! Total recipients: ${totalRecipients}`);
      return { campaign_id: campaign.id, total_recipients: totalRecipients, channels };
    } catch (err: any) {
      console.error(`[Espresso-Delivery] Error launching campaign:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to launch campaign: ${err.message}`);
    }
  });

export const getCampaignRoi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ campaign_id: z.string() }).parse(input))
  .handler(async ({ data: { campaign_id } }) => {
    try {
      console.log(`[AI-Barista-Engine] Calculating ROI for campaign ${campaign_id}...`);
      const { getCampaign } = await import("@/lib/queries.functions");
      const campaignData = await getCampaign({ data: { id: campaign_id } });
      const { campaign, stats } = campaignData;

      const COSTS: Record<string, number> = {
        whatsapp: 0.35,
        sms: 0.18,
        email: 0.05,
        rcs: 0.28,
      };

      const channels = campaign.channel.split(",").map((c: string) => c.trim().toLowerCase());
      let avgCost = 0;
      for (const ch of channels) {
        avgCost += COSTS[ch] || 0.1;
      }
      const costPerMessage = channels.length > 0 ? avgCost / channels.length : 0;

      const totalRecipients = stats.total || campaign.total_recipients || 0;

      const cost = costPerMessage * totalRecipients;
      const revenue = stats.clicked * 0.03 * 1600;
      const profit = revenue - cost;
      const roiPercentage = cost > 0 && revenue > 0 ? ((revenue - cost) / cost) * 100 : null;

      console.log(`[AI-Barista-Engine] ROI calculated successfully.`);
      return {
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        roi_multiple: roiPercentage !== null ? `${Math.round(roiPercentage)}%` : "—",
        orders: stats.ordered,
        cost_per_message: Math.round(costPerMessage * 100) / 100,
        by_channel: [] as any,
      };
    } catch (err: any) {
      console.error(`[AI-Barista-Engine] Error calculating ROI:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to calculate ROI: ${err.message}`);
    }
  });

export const getCampaignStats = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ campaign_id: z.string() }).parse(input))
  .handler(async ({ data: { campaign_id } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Fetching stats for campaign ${campaign_id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .single();
      const { data: msgs } = await supabaseAdmin
        .from("messages")
        .select("status")
        .eq("campaign_id", campaign_id);
      const arr = (msgs ?? []) as { status: string }[];
      const engaged = ["delivered", "opened", "clicked", "ordered"];
      const total = arr.length;
      const sent = arr.filter((m) => m.status !== "queued").length;
      const delivered = arr.filter((m) => engaged.includes(m.status)).length;
      const opened = arr.filter((m) => ["opened", "clicked", "ordered"].includes(m.status)).length;
      const clicked = arr.filter((m) => ["clicked", "ordered"].includes(m.status)).length;
      const ordered = arr.filter((m) => m.status === "ordered").length;
      const failed = arr.filter((m) => m.status === "failed").length;
      const open_rate = delivered ? (opened / delivered) * 100 : 0;
      const click_rate = delivered ? (clicked / delivered) * 100 : 0;
      const order_rate = delivered ? (ordered / delivered) * 100 : 0;
      
      console.log(`[Roastery-DB-Engine] Stats fetched successfully.`);
      return {
        name: campaign?.name,
        status: campaign?.status,
        total_recipients: total,
        sent,
        delivered,
        opened,
        clicked,
        ordered,
        failed,
        open_rate: Math.round(open_rate * 10) / 10,
        click_rate: Math.round(click_rate * 10) / 10,
        order_rate: Math.round(order_rate * 10) / 10,
      };
    } catch (err: any) {
      console.error(`[Roastery-DB-Engine] Error fetching campaign stats:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to fetch campaign stats: ${err.message}`);
    }
  });

export const createManualCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1),
        channel: z.string().min(1),
        status: z.string().default("draft"),
        segment_description: z.string().min(1),
        message_template: z.string().optional().default(""),
        total_recipients: z.number().default(0),
      })
      .parse(input),
  )
  .handler(async ({ data: { name, channel, status, segment_description, message_template, total_recipients } }) => {
    try {
      console.log(`[Espresso-Delivery] Creating manual brew drop: ${name}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: campaign, error } = await supabaseAdmin
        .from("campaigns")
        .insert({
          name,
          channel,
          status,
          segment_query: "1=1",
          segment_description,
          message_template,
          total_recipients,
        })
        .select()
        .single();
      if (error) throw error;
      console.log(`[Espresso-Delivery] Brew drop created successfully.`);
      return campaign;
    } catch (err: any) {
      console.error(`[Espresso-Delivery] Error creating manual campaign:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to create manual campaign: ${err.message}`);
    }
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ campaign_id: z.string() }).parse(input))
  .handler(async ({ data: { campaign_id } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Deleting brew drop ${campaign_id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error: msgErr } = await supabaseAdmin
        .from("messages")
        .delete()
        .eq("campaign_id", campaign_id);
      if (msgErr) throw msgErr;
      const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", campaign_id);
      if (error) throw error;
      console.log(`[Roastery-DB-Engine] Brew drop deleted successfully.`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Roastery-DB-Engine] Error deleting campaign:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to delete campaign: ${err.message}`);
    }
  });

export const updateCampaignStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ campaign_id: z.string(), status: z.string() }).parse(input),
  )
  .handler(async ({ data: { campaign_id, status } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Updating brew drop status for ${campaign_id} to ${status}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error } = await supabaseAdmin
        .from("campaigns")
        .update({ status })
        .eq("id", campaign_id);
      if (error) throw error;
      console.log(`[Roastery-DB-Engine] Status updated successfully.`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Roastery-DB-Engine] Error updating campaign status:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to update campaign status: ${err.message}`);
    }
  });

export const updateManualCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        name: z.string().min(1),
        channel: z.string().min(1),
        status: z.string().default("draft"),
        segment_description: z.string().min(1),
        message_template: z.string().optional().default(""),
        total_recipients: z.number().default(0),
      })
      .parse(input),
  )
  .handler(async ({ data: { id, name, channel, status, segment_description, message_template, total_recipients } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Updating manual brew drop ${id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: campaign, error } = await supabaseAdmin
        .from("campaigns")
        .update({
          name,
          channel,
          status,
          segment_description,
          message_template,
          total_recipients,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      console.log(`[Roastery-DB-Engine] Brew drop updated successfully.`);
      return campaign;
    } catch (err: any) {
      console.error(`[Roastery-DB-Engine] Error updating manual campaign:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to update manual campaign: ${err.message}`);
    }
  });
