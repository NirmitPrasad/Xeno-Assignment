import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import {
  BASE_SYSTEM_PROMPT,
  EXECUTOR_INSTRUCTIONS,
  ANALYST_INSTRUCTIONS,
  COPYWRITER_INSTRUCTIONS,
  tools,
} from "@/lib/anthropic";
import { getGeminiApiKey, getGeminiModel } from "@/lib/gemini.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("mode") ?? "executor";
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        try {
          getGeminiApiKey();
        } catch {
          return new Response("Missing GEMINI_API_KEY", { status: 500 });
        }

        let systemPrompt = BASE_SYSTEM_PROMPT;
        if (mode === "analyst") {
          systemPrompt += "\n" + ANALYST_INSTRUCTIONS;
        } else if (mode === "copywriter") {
          systemPrompt += "\n" + COPYWRITER_INSTRUCTIONS;
        } else {
          systemPrompt += "\n" + EXECUTOR_INSTRUCTIONS;
        }

        const result = streamText({
          model: getGeminiModel(),
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
