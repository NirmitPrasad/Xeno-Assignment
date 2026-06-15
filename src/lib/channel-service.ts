/**
 * This is a stub service that simulates real multi-channel communication providers (WhatsApp, SMS, Email, RCS).
 * In a production environment, the dispatch() function would be replaced with actual API calls to real providers
 * such as Twilio (for WhatsApp/SMS), Karix (for RCS), or Resend/SendGrid (for Email), and their respective delivery/read
 * callbacks would be received asynchronously via public webhook endpoints (e.g., /api/v1/webhook/receiver).
 */

import crypto from "crypto";
import type { Channel, CallbackEvent } from "@/types";

// Per-channel realistic behaviour. Numbers are rough industry averages.
const CHANNEL_PROFILE: Record<
  Channel,
  {
    deliver_rate: number;
    open_rate: number; // out of delivered
    click_rate: number; // out of opened
    order_rate: number; // out of clicked
    char_limit: number;
    cost_per_msg: number; // ₹
    label: string;
  }
> = {
  whatsapp: {
    deliver_rate: 0.97,
    open_rate: 0.72,
    click_rate: 0.34,
    order_rate: 0.22,
    char_limit: 1024,
    cost_per_msg: 0.58,
    label: "WhatsApp",
  },
  sms: {
    deliver_rate: 0.98,
    open_rate: 0.4,
    click_rate: 0.1,
    order_rate: 0.15,
    char_limit: 160,
    cost_per_msg: 0.15,
    label: "SMS",
  },
  email: {
    deliver_rate: 0.93,
    open_rate: 0.34,
    click_rate: 0.09,
    order_rate: 0.18,
    char_limit: 5000,
    cost_per_msg: 0.04,
    label: "Email",
  },
  rcs: {
    deliver_rate: 0.92,
    open_rate: 0.55,
    click_rate: 0.2,
    order_rate: 0.2,
    char_limit: 2500,
    cost_per_msg: 0.32,
    label: "RCS",
  },
};

export function getChannelProfile(channel: Channel) {
  return CHANNEL_PROFILE[channel];
}

export function listChannelProfiles() {
  return Object.entries(CHANNEL_PROFILE).map(([id, p]) => ({ id: id as Channel, ...p }));
}

// "Send" via the channel-specific adapter. Produces the lifecycle events
// that would normally come back as webhooks.
export function dispatch(
  message: { id: string; channel: Channel; personalised_text: string },
  baseTime = Date.now(),
): CallbackEvent[] {
  const ch = message.channel;
  const p = CHANNEL_PROFILE[ch];
  const providerId = `${ch}_${crypto.randomBytes(6).toString("hex")}`;
  const events: CallbackEvent[] = [];

  const sentAt = new Date(baseTime - Math.floor(Math.random() * 60_000));
  events.push({
    message_id: message.id,
    provider_message_id: providerId,
    channel: ch,
    event: "sent",
    at: sentAt.toISOString(),
    metadata: { adapter: `${ch}-adapter-v1` },
  });

  const deliveredAt = new Date(sentAt.getTime() + 1500 + Math.random() * 4000);
  if (Math.random() < p.deliver_rate) {
    events.push({
      message_id: message.id,
      provider_message_id: providerId,
      channel: ch,
      event: "delivered",
      at: deliveredAt.toISOString(),
    });
    if (Math.random() < p.open_rate) {
      const openedAt = new Date(deliveredAt.getTime() + 3000 + Math.random() * 30000);
      events.push({
        message_id: message.id,
        provider_message_id: providerId,
        channel: ch,
        event: "opened",
        at: openedAt.toISOString(),
      });
      if (Math.random() < p.click_rate) {
        const clickedAt = new Date(openedAt.getTime() + 2000 + Math.random() * 8000);
        events.push({
          message_id: message.id,
          provider_message_id: providerId,
          channel: ch,
          event: "clicked",
          at: clickedAt.toISOString(),
        });
        if (Math.random() < p.order_rate) {
          const orderedAt = new Date(clickedAt.getTime() + 30_000 + Math.random() * 120_000);
          const orderValue = Math.round((800 + Math.random() * 4200) * 100) / 100;
          events.push({
            message_id: message.id,
            provider_message_id: providerId,
            channel: ch,
            event: "ordered",
            at: orderedAt.toISOString(),
            metadata: { order_value: orderValue, currency: "INR" },
          });
        }
      }
    }
  } else {
    events.push({
      message_id: message.id,
      provider_message_id: providerId,
      channel: ch,
      event: "failed",
      at: deliveredAt.toISOString(),
      metadata: { reason: "carrier_unreachable", code: "DLV-503" },
    });
  }

  return events;
}

// Apply a single provider callback to the CRM database.
// This is the function the public /api/public/channel-callback route invokes.
export async function applyCallback(supabaseAdmin: any, ev: CallbackEvent): Promise<void> {
  const update: Record<string, any> = {};
  switch (ev.event) {
    case "sent":
      update.status = "sent";
      update.sent_at = ev.at;
      break;
    case "delivered":
      update.status = "delivered";
      update.delivered_at = ev.at;
      break;
    case "opened":
      update.status = "opened";
      update.opened_at = ev.at;
      break;
    case "clicked":
      update.status = "clicked";
      update.clicked_at = ev.at;
      break;
    case "ordered":
      update.status = "ordered";
      break;
    case "failed":
      update.status = "failed";
      break;
    case "retry":
      // retry_count is incremented separately
      break;
  }
  if (Object.keys(update).length > 0) {
    await supabaseAdmin.from("messages").update(update).eq("id", ev.message_id);
  }
  await supabaseAdmin.from("events").insert({
    message_id: ev.message_id,
    event_type: ev.event,
    metadata: { provider_message_id: ev.provider_message_id, ...(ev.metadata ?? {}) },
    created_at: ev.at,
  });
}

// Convenience: send a batch and apply all callbacks. Used by launchCampaign.
export async function dispatchAndApply(
  supabaseAdmin: any,
  messages: { id: string; channel: Channel; personalised_text: string }[],
) {
  const allEvents: CallbackEvent[] = [];
  for (const m of messages) {
    allEvents.push(...dispatch(m));
  }
  // Apply in chronological order so the message.status reflects the latest event.
  allEvents.sort((a, b) => a.at.localeCompare(b.at));

  // Batch insert events for speed
  const eventRows = allEvents.map((ev) => ({
    message_id: ev.message_id,
    event_type: ev.event,
    metadata: { provider_message_id: ev.provider_message_id, ...(ev.metadata ?? {}) },
    created_at: ev.at,
  }));
  for (let i = 0; i < eventRows.length; i += 200) {
    await supabaseAdmin.from("events").insert(eventRows.slice(i, i + 200));
  }

  // Compute final status per message and apply
  const lastStatus = new Map<
    string,
    {
      status: string;
      sent_at?: string;
      delivered_at?: string;
      opened_at?: string;
      clicked_at?: string;
    }
  >();
  for (const ev of allEvents) {
    const cur = lastStatus.get(ev.message_id) ?? { status: "queued" };
    if (ev.event === "sent") cur.sent_at = ev.at;
    if (ev.event === "delivered") cur.delivered_at = ev.at;
    if (ev.event === "opened") cur.opened_at = ev.at;
    if (ev.event === "clicked") cur.clicked_at = ev.at;
    if (["sent", "delivered", "opened", "clicked", "ordered", "failed"].includes(ev.event)) {
      cur.status = ev.event;
    }
    lastStatus.set(ev.message_id, cur);
  }
  const updates = Array.from(lastStatus.entries()).map(([id, u]) =>
    supabaseAdmin.from("messages").update(u).eq("id", id),
  );
  await Promise.all(updates);

  return { events: allEvents.length, messages: messages.length };
}
