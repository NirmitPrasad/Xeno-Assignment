import { createFileRoute } from "@tanstack/react-router";
import CustomersPage from "@/pages/Customers";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers · Coffee CRM" },
      { name: "description", content: "Browse, search, and export your customer base." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});
