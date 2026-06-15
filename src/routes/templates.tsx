import { createFileRoute } from "@tanstack/react-router";
import TemplatesPage from "@/pages/Templates";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Message templates · Coffee CRM" },
      {
        name: "description",
        content:
          "Reusable message templates with personalisation variables for WhatsApp, SMS, and email campaigns.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TemplatesPage,
});
