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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && !isStreaming;

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

  const showTypingIndicator = isStreaming && !streamingContent;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--brand-bg)',
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--text-on-bg)' }}
              >
                S
              </span>
            </div>
            <h2
              className="text-xl font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Hello, I&apos;m Saraswati
            </h2>
            <p
              className="max-w-md text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your AI trading assistant for Delta Exchange. Ask me about market
              analysis, trading strategies, price movements, and more.
            </p>
          </div>

          <div className="w-full max-w-xl">
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Quick actions
            </p>
            <QuickActionPills onAction={onQuickAction} />
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {streamingMessage && <ChatMessage message={streamingMessage} />}

          {showTypingIndicator && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-secondary)',
                  borderRadius: '12px 12px 12px 2px',
                }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--brand-bg)',
                    }}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: 'var(--text-on-bg)' }}
                    >
                      S
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--brand-text)' }}
                  >
                    Saraswati
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="size-1.5 animate-bounce rounded-full [animation-delay:0ms]"
                    style={{ background: 'var(--text-tertiary)' }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full [animation-delay:150ms]"
                    style={{ background: 'var(--text-tertiary)' }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full [animation-delay:300ms]"
                    style={{ background: 'var(--text-tertiary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
