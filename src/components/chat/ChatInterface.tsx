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

  // Hydrate conversations from localStorage on mount
  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  // Handle regular message send
  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, { type: 'general' });
    },
    [sendMessage],
  );

  // Handle quick action
  const handleQuickAction = useCallback(
    (prompt: string, contextType: string) => {
      sendMessage(prompt, { type: contextType });
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col bg-[#101013]">
      {/* Message list (scrollable, fills available space) */}
      <ChatMessageList onQuickAction={handleQuickAction} />

      {/* Input bar (sticky at bottom) */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />

      {/* Disclaimer */}
      <div className="border-t border-[#2a2a32]/50 bg-[#101013] px-4 py-2 text-center">
        <p className="text-[10px] text-[#6b7280]">
          AI-generated content. For reference only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
