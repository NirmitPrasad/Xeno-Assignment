import { createFileRoute } from "@tanstack/react-router";
import AnalyticsPage from "@/pages/Analytics";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Coffee CRM" }] }),
  component: AnalyticsPage,
});
