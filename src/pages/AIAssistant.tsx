import React from "react";
import { useSearch } from "@tanstack/react-router";
import { ChatWindow } from "@/components/ai-assistant/ChatWindow";

export default function ChatPage() {
  const search = useSearch({ from: "/chat" }) as { msg?: string };
  return <ChatWindow initialMsg={search.msg} />;
}
