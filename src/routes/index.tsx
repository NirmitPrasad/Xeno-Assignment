import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coffee CRM" },
      {
        name: "description",
        content: "CRM Dashboard for tracking customers, orders, and campaigns.",
      },
    ],
  }),
  component: DashboardPage,
});
