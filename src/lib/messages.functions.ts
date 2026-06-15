import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMessageEvents = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ message_id: z.string(), status: z.string().optional() }).parse(input),
  )
  .handler(async ({ data: { message_id, status } }) => {
    try {
      console.log(`[Espresso-Delivery] Fetching telemetry for brew drop message ${message_id}...`);
      if (message_id.startsWith("mock-")) {
        const now = Date.now();
        const st = status || "sent";
        const events: any[] = [
          { id: "e1", event_type: "sent", created_at: new Date(now - 60000).toISOString() },
        ];
        if (["delivered", "opened", "clicked", "ordered"].includes(st)) {
          events.push({
            id: "e2",
            event_type: "delivered",
            created_at: new Date(now - 45000).toISOString(),
          });
        }
        if (["opened", "clicked", "ordered"].includes(st)) {
          events.push({
            id: "e3",
            event_type: "opened",
            created_at: new Date(now - 30000).toISOString(),
          });
        }
        if (["clicked", "ordered"].includes(st)) {
          events.push({
            id: "e4",
            event_type: "clicked",
            created_at: new Date(now - 15000).toISOString(),
          });
        }
        if (st === "ordered") {
          events.push({
            id: "e5",
            event_type: "ordered",
            created_at: new Date(now - 5000).toISOString(),
            metadata: { order_id: "ORD-9821" },
          });
        }
        return events;
      }

      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: events } = await supabaseAdmin
        .from("events")
        .select("*")
        .eq("message_id", message_id)
        .order("created_at", { ascending: true });
      console.log(`[Espresso-Delivery] Telemetry fetched.`);
      return events ?? [];
    } catch (err: any) {
      console.error(`[Espresso-Delivery] Error fetching message events:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to fetch message telemetry: ${err.message}`);
    }
  });

export const retryFailedMessages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ campaign_id: z.string().uuid() }).parse(input))
  .handler(async ({ data: { campaign_id } }) => {
    try {
      console.log(`[Espresso-Delivery] Retrying failed coffee drips for campaign ${campaign_id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: failed } = await supabaseAdmin
        .from("messages")
        .select("id, retry_count")
        .eq("campaign_id", campaign_id)
        .eq("status", "failed");

      const rows = (failed ?? []) as { id: string; retry_count: number }[];
      if (rows.length === 0) return { attempted: 0, recovered: 0, still_failed: 0 };

      let recovered = 0;
      let stillFailed = 0;
      const now = Date.now();
      const events: any[] = [];

      for (const m of rows) {
        // Simulate retry: 70% success
        const success = Math.random() < 0.7;
        const sentAt = new Date(now).toISOString();
        if (success) {
          const deliveredAt = new Date(now + 2000).toISOString();
          await supabaseAdmin
            .from("messages")
            .update({
              status: "delivered",
              sent_at: sentAt,
              delivered_at: deliveredAt,
              retry_count: m.retry_count + 1,
            })
            .eq("id", m.id);
          events.push({
            message_id: m.id,
            event_type: "retry",
            metadata: { attempt: m.retry_count + 1 },
            created_at: sentAt,
          });
          events.push({
            message_id: m.id,
            event_type: "delivered",
            metadata: { via: "retry" },
            created_at: deliveredAt,
          });
          recovered++;
        } else {
          await supabaseAdmin
            .from("messages")
            .update({ status: "failed", retry_count: m.retry_count + 1, sent_at: sentAt })
            .eq("id", m.id);
          events.push({
            message_id: m.id,
            event_type: "retry",
            metadata: { attempt: m.retry_count + 1 },
            created_at: sentAt,
          });
          events.push({
            message_id: m.id,
            event_type: "failed",
            metadata: { reason: "retry_exhausted" },
            created_at: sentAt,
          });
          stillFailed++;
        }
      }

      if (events.length > 0) {
        for (let i = 0; i < events.length; i += 200) {
          await supabaseAdmin.from("events").insert(events.slice(i, i + 200));
        }
      }

      console.log(`[Espresso-Delivery] Retried ${rows.length} messages. Recovered: ${recovered}.`);
      return { attempted: rows.length, recovered, still_failed: stillFailed };
    } catch (err: any) {
      console.error(`[Espresso-Delivery] Error retrying failed messages:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to retry message delivery: ${err.message}`);
    }
  });
