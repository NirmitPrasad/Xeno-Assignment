import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import ChatPage from "@/pages/AIAssistant";

export const Route = createFileRoute("/chat")({
  validateSearch: (search) => z.object({ msg: z.string().optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Coffee CRM — AI Assistant" },
      { name: "description", content: "Talk to your AI marketing assistant." },
    ],
  }),
  component: ChatPage,
});
