import { useChat as useAiChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function useChat(mode: "executor" | "analyst" | "copywriter", onError?: (e: Error) => void) {
  return useAiChat({
    transport: new DefaultChatTransport({ api: `/api/chat?mode=${mode}` }),
    onError,
  });
}
