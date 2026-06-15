import { createFileRoute } from "@tanstack/react-router";
import CampaignsPage from "@/pages/Campaigns";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns · Coffee CRM" },
      {
        name: "description",
        content:
          "All campaigns created by your AI assistant — status, recipients, open and click rates.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignsPage,
});
