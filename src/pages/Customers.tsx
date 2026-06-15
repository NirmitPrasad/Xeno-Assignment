import React, { useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "sonner";
import { CustomerSheet } from "@/components/customers/CustomerSheet";
import { CustomerTable } from "@/components/customers/CustomerTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("total_spent-desc");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data } = useCustomers(search, sort);

  const handleExport = () => {
    const rows = (data?.customers ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? "",
      city: c.city ?? "",
      tags: (c.tags ?? []).join("|"),
      total_orders: c.total_orders,
      total_spent: c.total_spent,
      last_order_date: c.last_order_date ?? "",
      created_at: c.created_at,
    }));
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    toast.success(`Exported ${rows.length} customers`);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Guest Directory</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!data?.customers?.length}
        >
          <Download className="size-4 mr-2" /> Export CSV
        </Button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-background text-foreground"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px] bg-background text-foreground">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total_spent-desc">Highest Spent First</SelectItem>
            <SelectItem value="total_spent-asc">Lowest Spent First</SelectItem>
            <SelectItem value="total_orders-desc">Most Orders First</SelectItem>
            <SelectItem value="total_orders-asc">Least Orders First</SelectItem>
            <SelectItem value="last_order_date-desc">Recent Orders First</SelectItem>
            <SelectItem value="last_order_date-asc">Oldest Orders First</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomerTable customers={data?.customers ?? []} onSelectCustomer={setSelectedCustomerId} />

      <CustomerSheet customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
    </div>
  );
}
