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
    if (!hydrated) {
      hydrate();
    }
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
    <div className="relative flex h-full flex-col bg-[#08090a]">
      {/* Subtle dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1e2024 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.3,
        }}
      />

      {/* Message list (scrollable, fills available space) */}
      <ChatMessageList onQuickAction={handleQuickAction} />

      {/* Input bar (sticky at bottom) */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      {/* Disclaimer */}
      <div className="relative border-t border-[#1e2024]/50 bg-[#08090a] px-4 py-2 text-center">
        <p className="text-[10px] text-[#555a65]">
          AI-generated content. For reference only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
