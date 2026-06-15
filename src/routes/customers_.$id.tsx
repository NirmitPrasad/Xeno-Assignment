import { createFileRoute } from "@tanstack/react-router";
import CustomerProfilePage from "@/pages/CustomerProfile";

export const Route = createFileRoute("/customers_/$id")({
  head: () => ({ meta: [{ title: "Customer · Coffee CRM" }] }),
  component: CustomerProfilePage,
});
