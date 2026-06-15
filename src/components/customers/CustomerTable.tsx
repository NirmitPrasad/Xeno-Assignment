import React from "react";
import { format } from "date-fns";

interface CustomerTableProps {
  customers: any[];
  onSelectCustomer: (id: string) => void;
}

export function CustomerTable({ customers, onSelectCustomer }: CustomerTableProps) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c: any) => (
              <tr
                key={c.id}
                className="border-t hover:bg-accent/40 cursor-pointer text-foreground"
                onClick={() => onSelectCustomer(c.id)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-primary hover:underline">{c.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3 text-right">{c.total_orders}</td>
                <td className="px-4 py-3 text-right">
                  ₹{Number(c.total_spent).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.last_order_date ? format(new Date(c.last_order_date), "dd MMM yyyy") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
