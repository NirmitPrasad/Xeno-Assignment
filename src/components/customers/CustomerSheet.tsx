import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCustomer } from "@/lib/queries.functions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CustomerAiInsights } from "@/components/analytics/AiInsights";
import { Loader2, ShoppingBag, Clock, IndianRupee, Mail, Phone, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CustomerSheet({
  customerId,
  onClose,
}: {
  customerId: string | null;
  onClose: () => void;
}) {
  const fn = useServerFn(getCustomer);
  const { data, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => fn({ data: { id: customerId! } }),
    enabled: !!customerId,
  });

  if (!customerId) return null;

  return (
    <Sheet open={!!customerId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 border-l bg-slate-50/50"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin mr-2" /> Loading profile...
          </div>
        ) : data?.customer ? (
          <>
            <SheetHeader className="p-6 pb-4 bg-background border-b shadow-sm z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {data.customer.name.charAt(0)}
                    </div>
                    {data.customer.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {data.customer.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {data.customer.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {data.customer.city}
                    </span>
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                  ID: {data.customer.id.split("-")[0]}
                </Badge>
                {(data.customer.tags ?? []).map((t: string) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="capitalize text-xs font-medium bg-background"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                  label="Total Orders"
                  value={data.customer.total_orders}
                  icon={ShoppingBag}
                  className="bg-blue-50/50 border-blue-100 text-blue-900"
                  iconClass="text-blue-500 bg-blue-100"
                />
                <MetricCard
                  label="Total Spent"
                  value={`₹${Number(data.customer.total_spent).toLocaleString("en-IN")}`}
                  icon={IndianRupee}
                  className="bg-stone-900/50 border-stone-800 text-amber-700"
                  iconClass="text-amber-500 bg-stone-900"
                />
                <MetricCard
                  label="Avg Order Value"
                  value={`₹${(data.customer.total_orders ? Math.round(Number(data.customer.total_spent) / data.customer.total_orders) : 0).toLocaleString("en-IN")}`}
                  icon={IndianRupee}
                  className="bg-amber-50/50 border-amber-100 text-amber-900"
                  iconClass="text-amber-500 bg-amber-100"
                />
                <MetricCard
                  label="Last Order"
                  value={
                    data.customer.last_order_date
                      ? `${Math.floor((Date.now() - new Date(data.customer.last_order_date).getTime()) / 86400000)} days ago`
                      : "—"
                  }
                  icon={Clock}
                  className="bg-purple-50/50 border-purple-100 text-purple-900"
                  iconClass="text-purple-500 bg-purple-100"
                />
              </div>

              <div className="mb-8">
                <CustomerAiInsights customerId={data.customer.id} />
              </div>

              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                  <TabsTrigger value="orders">Order History</TabsTrigger>
                  <TabsTrigger value="messages">Campaign Communications</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4">
                  {data.orders.length > 0 ? (
                    <Card className="overflow-hidden shadow-sm">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                              <th className="px-4 py-3 font-medium text-muted-foreground">Items</th>
                              <th className="px-4 py-3 font-medium text-muted-foreground text-right">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {data.orders.map(
                              (o: {
                                id: string;
                                created_at: string;
                                total: number | string;
                                items: unknown;
                              }) => {
                                const items = (o.items ?? []) as {
                                  product_name: string;
                                  quantity: number;
                                }[];
                                return (
                                  <tr
                                    key={o.id}
                                    className="bg-background hover:bg-muted/30 transition-colors text-foreground"
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {format(new Date(o.created_at), "dd MMM yyyy")}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        {items.map(
                                          (
                                            i: { product_name: string; quantity: number },
                                            idx: number,
                                          ) => (
                                            <span key={idx} className="flex items-center gap-2">
                                              <span className="font-medium">{i.product_name}</span>
                                              <span className="text-muted-foreground text-xs">
                                                ×{i.quantity}
                                              </span>
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                                      ₹{Number(o.total).toLocaleString("en-IN")}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center p-8 bg-background border rounded-lg text-muted-foreground">
                      No orders found.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                  {data.messages.length > 0 ? (
                    <Card className="overflow-hidden shadow-sm">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="px-4 py-3 font-medium text-muted-foreground">
                                Campaign
                              </th>
                              <th className="px-4 py-3 font-medium text-muted-foreground">
                                Channel
                              </th>
                              <th className="px-4 py-3 font-medium text-muted-foreground">
                                Status
                              </th>
                              <th className="px-4 py-3 font-medium text-muted-foreground">Sent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {data.messages.map(
                              (m: {
                                id: string;
                                campaigns: { name: string } | null;
                                channel: string;
                                status: string;
                                sent_at: string | null;
                              }) => (
                                <tr
                                  key={m.id}
                                  className="bg-background hover:bg-muted/30 transition-colors text-foreground"
                                >
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {m.campaigns?.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="secondary" className="capitalize text-[10px]">
                                      {m.channel}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      variant="outline"
                                      className={`capitalize text-[10px] font-medium
                                  ${
                                    m.status === "ordered"
                                      ? "bg-stone-900 text-amber-600 border-stone-800"
                                      : m.status === "clicked"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : m.status === "opened"
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : m.status === "failed"
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                `}
                                    >
                                      {m.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {m.sent_at ? format(new Date(m.sent_at), "dd MMM, HH:mm") : "—"}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center p-8 bg-background border rounded-lg text-muted-foreground">
                      No campaigns sent to this user yet.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Customer not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  className,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  iconClass?: string;
}) {
  return (
    <Card className={`p-4 shadow-sm border ${className}`}>
      <div className="flex flex-col gap-3">
        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
            {label}
          </div>
          <div className="text-xl font-bold font-sans text-foreground">{value}</div>
        </div>
      </div>
    </Card>
  );
}
