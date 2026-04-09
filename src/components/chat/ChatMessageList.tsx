'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { ChatMessage } from './ChatMessage';
import { QuickActionPills } from './QuickActionPills';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageListProps {
  onQuickAction: (prompt: string, contextType: string) => void;
}

export function ChatMessageList({ onQuickAction }: ChatMessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !isStreaming;

  // Build a temporary streaming message to display while assistant is responding
  const streamingMessage: ChatMessageType | null =
    isStreaming && streamingContent
      ? {
          id: '__streaming__',
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
          isStreaming: true,
        }
      : null;

  // When streaming just started but no content yet, show a typing indicator
  const showTypingIndicator = isStreaming && !streamingContent;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
      {isEmpty ? (
        // Empty state
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
          {/* Greeting */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#fd7d02] to-[#ff9a3e]">
              <span className="text-2xl font-bold text-black">S</span>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Hello, I&apos;m Saraswati
            </h2>
            <p className="max-w-md text-sm text-[#9ca3af]">
              Your AI trading assistant for Delta Exchange. Ask me about market
              analysis, trading strategies, price movements, and more.
            </p>
          </div>

          {/* Quick actions */}
          <div className="w-full max-w-xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#6b7280]">
              Quick actions
            </p>
            <QuickActionPills onAction={onQuickAction} />
          </div>
        </div>
      ) : (
        // Message list
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Streaming assistant message */}
          {streamingMessage && (
            <ChatMessage message={streamingMessage} />
          )}

          {/* Typing indicator (before any content arrives) */}
          {showTypingIndicator && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-[#1a1a1f] px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#fd7d02] to-[#ff9a3e]">
                    <span className="text-[10px] font-bold text-black">S</span>
                  </div>
                  <span className="text-xs font-medium text-[#fd7d02]">
                    Saraswati
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-[#6b7280] [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-[#6b7280] [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-[#6b7280] [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Invisible anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
