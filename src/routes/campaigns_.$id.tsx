import { createFileRoute } from "@tanstack/react-router";
import CampaignDetailPage from "@/pages/CampaignDetail";

export const Route = createFileRoute("/campaigns_/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Campaign · Coffee CRM` },
      {
        name: "description",
        content:
          "View campaign performance, message timelines, retry failed sends, and export results.",
      },
      { property: "og:title", content: "Campaign details — Coffee CRM" },
      { property: "og:url", content: `/campaigns/${params.id}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignDetailPage,
});
