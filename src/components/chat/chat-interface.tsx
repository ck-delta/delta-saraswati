"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "@/components/icons";
import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickActions } from "./quick-actions";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ChatInput } from "./chat-input";

const SUGGESTED_PROMPTS = [
  "What's the current state of the crypto market?",
  "Show me trending tokens on Delta Exchange",
  "Summarize today's crypto news",
];

export function ChatInterface() {
  const { messages, isStreaming, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const showTypingIndicator =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    !messages[messages.length - 1].content;

  return (
    <div className="flex h-full flex-col">
      {/* Quick Actions */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <QuickActions onAction={sendMessage} disabled={isStreaming} />
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[60vh] items-center justify-center">
            <div className="relative flex max-w-sm flex-col items-center gap-5 text-center">
              {/* Dot pattern background */}
              <div
                className="absolute inset-0 -m-8 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Large bot icon with gradient bg + pulse */}
              <motion.div
                className="relative flex size-16 items-center justify-center rounded-3xl"
                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(59,130,246,0.1))" }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bot className="size-8 text-amber-500" />
              </motion.div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  I&apos;m Delta Saraswati
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Your AI-powered crypto assistant. Ask me anything about
                  markets, tokens, or trading.
                </p>
              </div>

              {/* Suggested prompt pills */}
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-border bg-card/50 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-amber-500/50 hover:bg-[rgba(245,158,11,0.05)]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3 shrink-0 text-amber-500" />
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <TypingIndicator visible={showTypingIndicator} />
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
