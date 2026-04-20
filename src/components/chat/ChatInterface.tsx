'use client';

import { useCallback, useEffect } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

export function ChatInterface() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const hydrated = useChatStore((s) => s.hydrated);
  const hydrate = useChatStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, { type: 'general' });
    },
    [sendMessage],
  );

  const handleQuickAction = useCallback(
    (prompt: string, contextType: string) => {
      sendMessage(prompt, { type: contextType });
    },
    [sendMessage],
  );

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ background: 'var(--bg-sub-surface)' }}
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--divider-primary) 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
        }}
      />

      <ChatMessageList onQuickAction={handleQuickAction} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      <div
        className="relative px-4 py-2 text-center"
        style={{
          background: 'var(--bg-sub-surface)',
          borderTop: '1px solid var(--divider-primary)',
        }}
      >
        <p
          className="text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          AI-generated content. For reference only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
