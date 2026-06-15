// Public webhook endpoint that simulated channel adapters (WhatsApp / SMS /
// Email / RCS) POST status events to. Verifies a shared secret and forwards
// to applyCallback() which updates the CRM database.
//
// This receipt/callback route is called asynchronously by the simulated channel stub
// when message events occur, updating the message statuses in the CRM database.
// This is the core of the two-service loop (CRM requests send -> Provider adapts -> Provider calls callback webhook -> CRM updates status).
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const EventSchema = z.object({
  message_id: z.string().uuid(),
  provider_message_id: z.string(),
  channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
  event: z.enum(["sent", "delivered", "failed", "opened", "clicked", "ordered", "retry"]),
  at: z.string(),
  metadata: z.record(z.any()).optional().nullable(),
});

const PayloadSchema = z.object({
  events: z.array(EventSchema).min(1).max(500),
});

export const Route = createFileRoute("/api/v1/webhook/receiver")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Optional shared-secret check. In demo mode the secret is unset and
        // any caller is accepted; in real deployments set CHANNEL_WEBHOOK_SECRET.
        const expected = process.env.CHANNEL_WEBHOOK_SECRET;
        if (expected) {
          const provided = request.headers.get("x-channel-signature");
          if (provided !== expected) {
            return new Response("Invalid signature", { status: 401 });
          }
        }
        const body = await request.json().catch(() => null);
        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify(parsed.error.flatten()), { status: 400 });
        }

        const { supabaseAdmin } = await import("@/lib/supabase");
        const { applyCallback } = await import("@/lib/channel-service");
        for (const ev of parsed.data.events) {
          await applyCallback(supabaseAdmin, ev);
        }
        return Response.json({ ok: true, applied: parsed.data.events.length });
      },
    },
  },
});
