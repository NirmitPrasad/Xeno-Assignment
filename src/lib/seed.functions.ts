import { createServerFn } from "@tanstack/react-start";
import { faker } from "@faker-js/faker";
import crypto from "crypto";

const PRODUCTS = [
  { name: "Signature Dark Espresso", category: "espresso", price: 400 },
  { name: "Butter Croissant", category: "pastry", price: 250 },
  { name: "Artisanal Cold Brew", category: "coldbrew", price: 350 },
  { name: "Blueberry Muffin", category: "pastry", price: 300 },
  { name: "Matcha Green Tea", category: "tea", price: 300 },
  { name: "Caramel Frappe", category: "frappe", price: 450 },
  { name: "Single Origin Espresso", category: "espresso", price: 450 },
  { name: "Coffee Tumbler", category: "merch", price: 1200 },
  { name: "Vanilla Bean Latte", category: "latte", price: 350 },
  { name: "Almond Croissant", category: "pastry", price: 320 },
  { name: "Nitro Cold Brew", category: "coldbrew", price: 400 },
  { name: "Guatemala Roast Beans", category: "beans", price: 1500 },
  { name: "Oatmeal Cookie", category: "snack", price: 150 },
  { name: "Mango Tropics Smoothie", category: "smoothie", price: 350 },
  { name: "Ethiopia Yirgacheffe Beans", category: "beans", price: 1800 },
];

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Surat",
  "Indore",
  "Kochi",
  "Gurgaon",
  "Noida",
];
const FIRST = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Reyansh",
  "Sai",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Aanya",
  "Saanvi",
  "Ananya",
  "Aadhya",
  "Diya",
  "Myra",
  "Pari",
  "Anika",
  "Kiara",
  "Tara",
  "Riya",
  "Meera",
  "Isha",
  "Neha",
  "Priya",
  "Rhea",
  "Zara",
  "Aisha",
  "Kavya",
  "Nikita",
];
const LAST = [
  "Sharma",
  "Verma",
  "Gupta",
  "Mehta",
  "Patel",
  "Iyer",
  "Reddy",
  "Nair",
  "Kapoor",
  "Singh",
  "Chopra",
  "Joshi",
  "Rao",
  "Khanna",
  "Bhatia",
  "Malhotra",
  "Aggarwal",
  "Kulkarni",
  "Desai",
  "Pillai",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function randDate(monthsAgo: number) {
  const now = Date.now();
  const past = now - monthsAgo * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

export async function runSeed(force: boolean = false) {
  const { supabaseAdmin } = await import("@/lib/supabase");

  if (force) {
    await supabaseAdmin.from("events").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("messages").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("orders").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("campaigns").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("message_templates").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("customers").delete().gte("created_at", "2000-01-01");
    await supabaseAdmin.from("products").delete().gte("created_at", "2000-01-01");
  } else {
    // Check if already seeded
    const { count } = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return { ok: true, message: "Already seeded", customers: count };
    }
  }

  // Products
  const { data: products, error: pErr } = await supabaseAdmin
    .from("products")
    .insert(PRODUCTS)
    .select();
  if (pErr) throw pErr;

  // Customers (300 to keep seed fast)
  const customers: Array<{
    name: string;
    email: string;
    phone: string;
    city: string;
    tags: string[];
    created_at: string;
  }> = [];
  const totalCustomers = 300;
  for (let i = 0; i < totalCustomers; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    customers.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      phone: `+91${randInt(70, 99)}${randInt(10000000, 99999999)}`,
      city: pick(INDIAN_CITIES),
      tags: [],
      created_at: randDate(24).toISOString(),
    });
  }

  // Insert in batches
  const insertedCustomers: { id: string; name: string; email: string }[] = [];
  for (let i = 0; i < customers.length; i += 100) {
    const batch = customers.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert(batch)
      .select("id, name, email");
    if (error) throw error;
    insertedCustomers.push(...(data ?? []));
  }

  // Assign customer types
  const vipCount = Math.floor(totalCustomers * 0.2);
  const regularCount = Math.floor(totalCustomers * 0.3);
  const onetimeCount = Math.floor(totalCustomers * 0.3);
  // remaining are lapsed

  type Order = { customer_id: string; items: any; total: number; created_at: string };
  const orders: Order[] = [];
  const customerStats: Record<
    string,
    { total_orders: number; total_spent: number; last_order_date: Date | null; tags: Set<string> }
  > = {};
  for (const c of insertedCustomers)
    customerStats[c.id] = {
      total_orders: 0,
      total_spent: 0,
      last_order_date: null,
      tags: new Set(),
    };

  const makeOrder = (customerId: string, when: Date) => {
    const itemCount = randInt(1, 3);
    const items = [];
    let total = 0;
    const usedIdx = new Set<number>();
    for (let k = 0; k < itemCount; k++) {
      let idx = randInt(0, products!.length - 1);
      while (usedIdx.has(idx)) idx = randInt(0, products!.length - 1);
      usedIdx.add(idx);
      const p = products![idx];
      const qty = randInt(1, 2);
      items.push({
        product_id: p.id,
        product_name: p.name,
        category: p.category,
        price: Number(p.price),
        quantity: qty,
      });
      total += Number(p.price) * qty;
      customerStats[customerId].tags.add(p.category);
    }
    orders.push({ customer_id: customerId, items, total, created_at: when.toISOString() });
    const s = customerStats[customerId];
    s.total_orders++;
    s.total_spent += total;
    if (!s.last_order_date || when > s.last_order_date) s.last_order_date = when;
  };

  for (let i = 0; i < insertedCustomers.length; i++) {
    const c = insertedCustomers[i];
    if (i < vipCount) {
      // VIP: 5-12 orders, recent
      const n = randInt(5, 12);
      for (let k = 0; k < n; k++) makeOrder(c.id, randDate(6));
      customerStats[c.id].tags.add("vip");
    } else if (i < vipCount + regularCount) {
      const n = randInt(2, 4);
      for (let k = 0; k < n; k++) makeOrder(c.id, randDate(9));
    } else if (i < vipCount + regularCount + onetimeCount) {
      makeOrder(c.id, randDate(12));
    } else {
      // lapsed: 1-2 orders, all old (>4 months ago)
      const n = randInt(1, 2);
      for (let k = 0; k < n; k++) {
        const old = new Date(Date.now() - randInt(120, 600) * 24 * 60 * 60 * 1000);
        makeOrder(c.id, old);
      }
      customerStats[c.id].tags.add("lapsed");
    }
  }

  for (let i = 0; i < orders.length; i += 200) {
    const batch = orders.slice(i, i + 200);
    const { error } = await supabaseAdmin.from("orders").insert(batch);
    if (error) throw error;
  }

  // Update customers with derived stats
  for (const id of Object.keys(customerStats)) {
    const s = customerStats[id];
    await supabaseAdmin
      .from("customers")
      .update({
        total_orders: s.total_orders,
        total_spent: s.total_spent,
        last_order_date: s.last_order_date?.toISOString() ?? null,
        tags: Array.from(s.tags),
      })
      .eq("id", id);
  }

  // 1. Insert 6 campaigns
  const campaignData = [
    {
      name: "Artisanal Bean Subscription Perks",
      segment_query: "total_orders >= 5",
      segment_description: "VIP Customers in Top Cities",
      message_template: "Hey {name}, enjoy 20% off our premium artisanal beans this Diwali in {city}!",
      channel: "whatsapp",
      status: "completed",
      total_recipients: 30,
      created_at: randDate(1).toISOString(),
    },
    {
      name: "Espresso Lover Loyalty Reward",
      segment_query: "last_order_date < now() - interval '120 days'",
      segment_description: "Lapsed customers",
      message_template: "We miss you, {name}! Get 15% off your next espresso order.",
      channel: "email",
      status: "active",
      total_recipients: 25,
      created_at: randDate(2).toISOString(),
    },
    {
      name: "Monsoon Matcha Latte Special",
      segment_query: "tags @> array['espresso']",
      segment_description: "Bought cold brew never pastry",
      message_template: "Hi {name}, try our new Monsoon Matcha Latte today!",
      channel: "sms",
      status: "paused",
      total_recipients: 15,
      created_at: randDate(3).toISOString(),
    },
    {
      name: "Cold Brew Refill Reminder",
      segment_query: "tags @> array['coldbrew']",
      segment_description: "Cold Brew buyers",
      message_template: "Time for a refill, {name}? Order today!",
      channel: "rcs",
      status: "archived:completed",
      total_recipients: 10,
      created_at: randDate(4).toISOString(),
    },
    {
      name: "Cold Brew Morning Rush Promo",
      segment_query: "tags @> array['frappe']",
      segment_description: "Sunscreen buyers",
      message_template: "Jumpstart your morning rush this summer, {name}!",
      channel: "whatsapp",
      status: "failed",
      total_recipients: 10,
      created_at: randDate(5).toISOString(),
    },
    {
      name: "Winter Holiday Cappuccino Launch",
      segment_query: "",
      segment_description: "All customers",
      message_template: "Happy Holidays {name}! Enjoy our new Winter Cappuccino!",
      channel: "email",
      status: "draft",
      total_recipients: 0,
      created_at: randDate(6).toISOString(),
    },
    {
      name: "Midnight Midnight-Roast Blitz",
      segment_query: "total_spent > 5000",
      segment_description: "High spenders",
      message_template: "Get 50% off our Midnight Roast this Black Friday!",
      channel: "sms",
      status: "scheduled",
      total_recipients: 0,
      created_at: randDate(7).toISOString(),
    },
  ];

  const { data: dbCampaigns, error: cErr } = await supabaseAdmin
    .from("campaigns")
    .insert(campaignData)
    .select();
  if (cErr) throw cErr;

  // Let's create exactly 90 messages
  const messageCustomers = insertedCustomers.slice(0, 90);
  const messagesToInsert: any[] = [];
  const eventsToInsert: any[] = [];

  const distribution = [30, 25, 15, 10, 10, 0, 0];
  let custIndex = 0;

  // Failed: 6
  // Delivered but not opened: 34 (84 - 50)
  // Opened but not clicked: 20 (50 - 30)
  // Clicked but not ordered: 2 (30 - 28)
  // Ordered (Converted): 28
  // Total = 6 + 34 + 20 + 2 + 28 = 90
  const statuses = [
    ...Array(20).fill("ordered"),
    ...Array(5).fill("clicked"),
    ...Array(10).fill("opened"),
    ...Array(20).fill("delivered"),
    ...Array(10).fill("failed"),
  ];

  // Shuffle statuses
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  let statusIndex = 0;

  for (let i = 0; i < dbCampaigns.length; i++) {
    const campaign = dbCampaigns[i];
    const count = distribution[i];

    for (let k = 0; k < count; k++) {
      if (campaign.status === "draft" || campaign.status === "scheduled") {
        continue;
      }
      const c = messageCustomers[custIndex++];
      const status = campaign.status === "failed" ? "failed" : statuses[statusIndex++];
      const ch = campaign.channel;
      const msgId = crypto.randomUUID();
      const providerId = `${ch}_${crypto.randomBytes(6).toString("hex")}`;

      const personalisedText = (campaign.message_template ?? "")
        .replace(/\{name\}/gi, c.name.split(" ")[0])
        .replace(/\{city\}/gi, "Mumbai");

      const sentAt = randDate(1);

      messagesToInsert.push({
        id: msgId,
        campaign_id: campaign.id,
        customer_id: c.id,
        personalised_text: personalisedText,
        channel: ch,
        status: status,
        sent_at: sentAt.toISOString(),
        delivered_at: status !== "failed" ? new Date(sentAt.getTime() + 2000).toISOString() : null,
        opened_at: ["opened", "clicked", "ordered"].includes(status)
          ? new Date(sentAt.getTime() + 5000).toISOString()
          : null,
        clicked_at: ["clicked", "ordered"].includes(status)
          ? new Date(sentAt.getTime() + 10000).toISOString()
          : null,
      });

      // Events for message
      eventsToInsert.push({
        message_id: msgId,
        event_type: "sent",
        metadata: { provider_message_id: providerId },
        created_at: sentAt.toISOString(),
      });
      if (status !== "failed") {
        eventsToInsert.push({
          message_id: msgId,
          event_type: "delivered",
          metadata: { provider_message_id: providerId },
          created_at: new Date(sentAt.getTime() + 2000).toISOString(),
        });
        if (["opened", "clicked", "ordered"].includes(status)) {
          eventsToInsert.push({
            message_id: msgId,
            event_type: "opened",
            metadata: { provider_message_id: providerId },
            created_at: new Date(sentAt.getTime() + 5000).toISOString(),
          });
        }
        if (["clicked", "ordered"].includes(status)) {
          eventsToInsert.push({
            message_id: msgId,
            event_type: "clicked",
            metadata: { provider_message_id: providerId },
            created_at: new Date(sentAt.getTime() + 10000).toISOString(),
          });
        }
        if (status === "ordered") {
          eventsToInsert.push({
            message_id: msgId,
            event_type: "ordered",
            metadata: { provider_message_id: providerId, order_value: 1200 },
            created_at: new Date(sentAt.getTime() + 15000).toISOString(),
          });
        }
      } else {
        eventsToInsert.push({
          message_id: msgId,
          event_type: "failed",
          metadata: { provider_message_id: providerId, reason: "carrier_unreachable" },
          created_at: new Date(sentAt.getTime() + 2000).toISOString(),
        });
      }
    }
  }

  // Insert messages
  for (let i = 0; i < messagesToInsert.length; i += 100) {
    const { error } = await supabaseAdmin
      .from("messages")
      .insert(messagesToInsert.slice(i, i + 100));
    if (error) throw error;
  }

  // Insert events
  for (let i = 0; i < eventsToInsert.length; i += 200) {
    const { error } = await supabaseAdmin.from("events").insert(eventsToInsert.slice(i, i + 200));
    if (error) throw error;
  }

  // Insert message templates
  if (force) {
    await supabaseAdmin
      .from("message_templates")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }
  const { data: existingTemplates } = await supabaseAdmin
    .from("message_templates")
    .select("id")
    .eq("name", "Holi Coffee Fiesta")
    .limit(1);
  if (!existingTemplates || existingTemplates.length === 0) {
    const seedTemplates = [
      {
        name: "Holi Coffee Fiesta",
        channel: "sms",
        body: "Celebrate Holi with 30% off all brews! Use code HOLI30 at checkout. Hurry, offer ends soon. Shop now at gourmetcoffee.com",
        description: "Holi promotional offer",
        created_at: randDate(0.2).toISOString(),
      },
      {
        name: "New Signature Blend Launch",
        channel: "rcs",
        body: "Hi {name}! Discover our new Signature Espresso Blend. Rich flavor with dark chocolate notes without the bitterness. Check out the interactive carousel below to learn more!",
        description: "Signature Blend Launch",
        created_at: randDate(0.5).toISOString(),
      },
      {
        name: "Abandoned Cart",
        channel: "whatsapp",
        body: "Hey {name}, you left something behind! 🛒 Your items are waiting in your cart. Complete your purchase now and get free shipping to {city}: [Link]",
        description: "Cart recovery for WhatsApp",
        created_at: randDate(0.8).toISOString(),
      },
      {
        name: "First Brew Thanks",
        channel: "email",
        body: "Hi {full_name},\n\nThank you so much for your first purchase with Lumière! We're thrilled to have you in our community.\n\nAs a welcome gift, here's 15% off your next order: WELCOME15.\n\nStay glowing,\nThe Lumière Team",
        description: "Welcome email for new customers",
        created_at: randDate(1.2).toISOString(),
      },
      {
        name: "Birthday Brew",
        channel: "whatsapp",
        body: "Happy Birthday {name}! 🎂 To make your day special, we're giving you a complimentary slice of cake with your next coffee order. Claim your gift: [Link]",
        description: "Automated birthday message",
        created_at: randDate(1.5).toISOString(),
      },
      {
        name: "Monsoon Brewing Tips",
        channel: "email",
        body: "Hi {name},\n\nMonsoon season in {city} can be tough on your skin. Check out our 5 quick tips to keep your skin clear and glowing despite the humidity: [Link]\n\nStay radiant!",
        description: "Educational newsletter",
        created_at: randDate(1.8).toISOString(),
      },
      {
        name: "Loyalty Reward",
        channel: "sms",
        body: "Hi {name}, you've earned 500 Bean Points! Redeem them for Rs. 500 off your next coffee order. Thanks for being a VIP. Shop now: gourmetcoffee.com",
        description: "Points milestone notification",
        created_at: randDate(2.2).toISOString(),
      },
    ];
    await supabaseAdmin.from("message_templates").insert(seedTemplates);
  }

  return {
    ok: true,
    message: "Seeded successfully",
    customers: insertedCustomers.length,
    orders: orders.length,
  };
}

export const seedDatabase = createServerFn({ method: "POST" })
  .inputValidator((input: any) => {
    if (input && input.data && typeof input.data.force === "boolean") {
      return { force: input.data.force };
    }
    if (input && typeof input.force === "boolean") {
      return { force: input.force };
    }
    return { force: false };
  })
  .handler(async ({ data: { force } }) => {
    try {
      console.log(`[Roastery-DB-Engine] Executing database seed (force: ${force})...`);
      const result = await runSeed(force);
      console.log(`[Roastery-DB-Engine] Database seed completed successfully.`);
      return result;
    } catch (err: any) {
      console.error(`[Roastery-DB-Engine] Error during database seed:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to execute database seed: ${err.message}`);
    }
  });
