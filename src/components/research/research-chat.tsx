"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Bot } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useChat } from "@/hooks/use-chat";

interface ResearchChatProps {
  symbol: string;
}

export function ResearchChat({ symbol }: ResearchChatProps) {
  const { messages, isStreaming, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastMessages = messages.slice(-3);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastMessages.length, lastMessages[lastMessages.length - 1]?.content]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput("");
  }

  return (
    <Card className="p-0">
      <CardContent className="space-y-3 py-4 px-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><Bot className="size-3.5 text-primary" />Ask AI</h3>

        {/* Messages */}
        {lastMessages.length > 0 && (
          <div ref={scrollRef} className="max-h-48 space-y-2 overflow-y-auto">
            {lastMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/10 text-text-primary"
                    : "bg-elevated text-text-secondary"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {msg.content || (msg.isStreaming ? "Thinking..." : "")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${symbol}...`}
            className="flex-1 text-sm"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={isStreaming || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isStreaming ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUp className="size-3.5" />
            )}
          </Button>
        </form>

        {/* Quick prompt chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Analyze RSI trend", "Predict next support", "Explain funding rate"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { sendMessage(`${prompt} for ${symbol}`); }}
                disabled={isStreaming}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-text-secondary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
