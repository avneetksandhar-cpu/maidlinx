"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { getConversation, type ChatMessage } from "@/features/messages/data/conversations";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useState } from "react";

export function ChatScreen() {
  const params = useParams<{ id: string }>();
  const conversation = getConversation(params.id);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(conversation?.messages ?? []);

  if (!conversation) {
    return (
      <AppShell showNav>
        <AppHeader title="Messages" showBack backHref="/messages" />
        <p className="py-16 text-center text-sm text-ink-muted">Conversation not found.</p>
      </AppShell>
    );
  }

  function send() {
    const body = input.trim();
    if (!body) return;
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, from: "user", body, time: "Now" },
    ]);
    setInput("");
  }

  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader
          title={`${conversation.name}${conversation.active ? " · Active now" : ""}`}
          showBack
          backHref="/messages"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-24">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                message.from === "user"
                  ? "gold-btn rounded-br-md text-black"
                  : "rounded-bl-md bg-surface-elevated text-ink",
              )}
            >
              <p>{message.body}</p>
              <p className={cn("mt-1 text-[10px]", message.from === "user" ? "text-black/60" : "text-ink-subtle")}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-background px-5 pb-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Message"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={send}
            className="flex h-9 w-9 items-center justify-center rounded-full gold-btn text-black"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M3.4 20.6L21 12 3.4 3.4 3 10l11 2-11 2z" />
            </svg>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
