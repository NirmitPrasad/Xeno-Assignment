import { createFileRoute } from "@tanstack/react-router";
import SystemPage from "@/pages/System";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System · Coffee CRM" },
      { name: "description", content: "Where your customer data lives, with import & export." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemPage,
});
