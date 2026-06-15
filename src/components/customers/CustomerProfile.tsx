import React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCustomer } from "@/lib/queries.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CustomerAiInsights } from "@/components/analytics/AiInsights";

interface CustomerProfileProps {
  id: string;
}

export function CustomerProfile({ id }: { id: string }) {
  const fn = useServerFn(getCustomer);
  const { data } = useQuery({ queryKey: ["customer", id], queryFn: () => fn({ data: { id } }) });

  if (!data?.customer) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const c = data.customer;
  const aov = c.total_orders ? Math.round(Number(c.total_spent) / c.total_orders) : 0;
  const daysSince = c.last_order_date
    ? Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / 86400000)
    : null;

  return (
    <div className="p-8 space-y-6">
      <Link to="/customers" className="text-xs text-muted-foreground hover:underline">
        ← All customers
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{c.name}</h1>
        <p className="text-sm text-muted-foreground">
          {c.email} · {c.phone} · {c.city}
        </p>
        <div className="flex gap-2 mt-2">
          {(c.tags ?? []).map((t: string) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Orders</div>
          <div className="text-2xl font-semibold">{c.total_orders}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total spent</div>
          <div className="text-2xl font-semibold">
            ₹{Number(c.total_spent).toLocaleString("en-IN")}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg order value</div>
          <div className="text-2xl font-semibold">₹{aov.toLocaleString("en-IN")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Days since last order</div>
          <div className="text-2xl font-semibold">{daysSince ?? "—"}</div>
        </Card>
      </div>
      <CustomerAiInsights customerId={c.id} />
      <Card>
        <div className="p-4 border-b font-medium">Order history</div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {data.orders.map((o: any) => (
                <tr key={o.id} className="border-t text-foreground">
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                    {format(new Date(o.created_at), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-2">
                    {o.items.map((i: any) => `${i.product_name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    ₹{Number(o.total).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div className="p-4 border-b font-medium">Message history</div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {data.messages.map((m: any) => (
                <tr key={m.id} className="border-t text-foreground">
                  <td className="px-4 py-2">{m.campaigns?.name}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{m.channel}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.sent_at ? format(new Date(m.sent_at), "dd MMM HH:mm") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
