import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing credentials in process.env!");
  process.exit(1);
}

const supabaseAdmin = createClient(url, key);

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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function randDate(monthsAgo) {
  const now = Date.now();
  const past = now - monthsAgo * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function run() {
  console.log("Seeding database via script...");

  console.log("Clearing old data...");
  await supabaseAdmin.from("events").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("messages").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("orders").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("campaigns").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("message_templates").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("customers").delete().gte("created_at", "2000-01-01");
  await supabaseAdmin.from("products").delete().gte("created_at", "2000-01-01");
  

  // Check count
  

  // Products
  const { data: products, error: pErr } = await supabaseAdmin
    .from("products")
    .insert(PRODUCTS)
    .select();
  if (pErr) { console.error("Products seed failed:", pErr); process.exit(1); } else {
    console.log(`Inserted ${products.length} products`);
  }

  const { data: finalProducts } = await supabaseAdmin.from("products").select("*");

  // Customers
  const customers = [];
  const totalCustomers = 300;
  for (let i = 0; i < totalCustomers; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    customers.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}_${Date.now()}@example.com`,
      phone: `+91${randInt(70, 99)}${randInt(10000000, 99999999)}`,
      city: pick(INDIAN_CITIES),
      tags: [],
      created_at: randDate(24).toISOString(),
    });
  }

  const insertedCustomers = [];
  for (let i = 0; i < customers.length; i += 100) {
    const batch = customers.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert(batch)
      .select("id, name, email");
    if (error) {
      console.error("Customers insert failed:", error);
      process.exit(1);
    }
    insertedCustomers.push(...(data ?? []));
  }
  console.log(`Inserted ${insertedCustomers.length} customers`);

  // Orders
  const vipCount = Math.floor(totalCustomers * 0.2);
  const regularCount = Math.floor(totalCustomers * 0.3);
  const onetimeCount = Math.floor(totalCustomers * 0.3);

  const orders = [];
  const customerStats = {};
  for (const c of insertedCustomers) {
    customerStats[c.id] = {
      total_orders: 0,
      total_spent: 0,
      last_order_date: null,
      tags: new Set(),
    };
  }

  const makeOrder = (customerId, when) => {
    const itemCount = randInt(1, 3);
    const items = [];
    let total = 0;
    const usedIdx = new Set();
    for (let k = 0; k < itemCount; k++) {
      let idx = randInt(0, finalProducts.length - 1);
      while (usedIdx.has(idx)) idx = randInt(0, finalProducts.length - 1);
      usedIdx.add(idx);
      const p = finalProducts[idx];
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
      const n = randInt(5, 12);
      for (let k = 0; k < n; k++) makeOrder(c.id, randDate(6));
      customerStats[c.id].tags.add("vip");
    } else if (i < vipCount + regularCount) {
      const n = randInt(2, 4);
      for (let k = 0; k < n; k++) makeOrder(c.id, randDate(9));
    } else if (i < vipCount + regularCount + onetimeCount) {
      makeOrder(c.id, randDate(12));
    } else {
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
    if (error) {
      console.error("Orders insert failed:", error);
      process.exit(1);
    }
  }
  console.log(`Inserted ${orders.length} orders`);

  // Update customers
  for (const id of Object.keys(customerStats)) {
    const s = customerStats[id];
    await supabaseAdmin
      .from("customers")
      .update({
        total_orders: s.total_orders,
        total_spent: s.total_spent,
        last_order_date: s.last_order_date ? s.last_order_date.toISOString() : null,
        tags: Array.from(s.tags),
      })
      .eq("id", id);
  }

  // Seeding 6 campaigns
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
      segment_description: "Bought serums never moisturiser",
      message_template: "Hi {name}, try our new Monsoon Matcha Latte today!",
      channel: "sms",
      status: "scheduled",
      total_recipients: 15,
      created_at: randDate(3).toISOString(),
    },
    {
      name: "Cold Brew Refill Reminder",
      segment_query: "tags @> array['coldbrew']",
      segment_description: "Cold Brew buyers",
      message_template: "Time for a refill, {name}? Order today!",
      channel: "rcs",
      status: "draft",
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
      total_recipients: 5,
      created_at: randDate(5).toISOString(),
    },
    {
      name: "Winter Holiday Cappuccino Launch",
      segment_query: "tags @> array['merch']",
      segment_description: "Eye cream buyers",
      message_template: "Happy Holidays {name}! Enjoy our new Winter Cappuccino!",
      channel: "email",
      status: "completed",
      total_recipients: 5,
      created_at: randDate(6).toISOString(),
    },
  ];

  const { data: dbCampaigns, error: cErr } = await supabaseAdmin
    .from("campaigns")
    .insert(campaignData)
    .select();
  if (cErr) {
    console.error("Campaigns seed failed:", cErr);
    process.exit(1);
  }

  // Seeding 90 messages
  const messageCustomers = insertedCustomers.slice(0, 90);
  const messagesToInsert = [];
  const eventsToInsert = [];

  const distribution = [30, 25, 15, 10, 5, 5];
  let custIndex = 0;

  const statuses = [
    ...Array(20).fill("ordered"),
    ...Array(5).fill("clicked"),
    ...Array(10).fill("opened"),
    ...Array(20).fill("delivered"),
    ...Array(10).fill("failed"),
  ];

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

      const personalisedText = campaign.message_template
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

  for (let i = 0; i < messagesToInsert.length; i += 100) {
    await supabaseAdmin.from("messages").insert(messagesToInsert.slice(i, i + 100));
  }

  for (let i = 0; i < eventsToInsert.length; i += 200) {
    await supabaseAdmin.from("events").insert(eventsToInsert.slice(i, i + 200));
  }

  console.log("Database seeded successfully via script!");
}

run();
