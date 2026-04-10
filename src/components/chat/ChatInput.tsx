'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Send, Square, Brain } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = useChatStore((s) => s.isStreaming);
  const deepThink = useChatStore((s) => s.deepThink);
  const toggleDeepThink = useChatStore((s) => s.toggleDeepThink);
  const abortStream = useChatStore((s) => s.abortStream);

  const isDisabled = disabled || isStreaming;

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 160;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  }, [value, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="relative bg-[#111214] border-t border-[#1e2024] px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        {/* Deep Think toggle */}
        <button
          type="button"
          onClick={toggleDeepThink}
          title={deepThink ? 'Deep Think enabled' : 'Enable Deep Think'}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150',
            deepThink
              ? 'border-[#f7931a]/50 bg-[#f7931a]/15 text-[#f7931a]'
              : 'border-[#1e2024] bg-[#181a1d] text-[#555a65] hover:text-[#8b8f99] hover:border-[#2a2d33]',
          )}
        >
          <Brain className="size-4" />
        </button>

        {/* Input area */}
        <div className="relative flex flex-1 items-end rounded-xl border border-[#1e2024] bg-[#181a1d] px-3 py-2 focus-within:border-[#f7931a]/50 transition-colors duration-150">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Saraswati anything about crypto..."
            disabled={isDisabled}
            rows={1}
            className="max-h-[160px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-[#eaedf3] placeholder-[#555a65] outline-none disabled:opacity-50"
          />
        </div>

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={abortStream}
            title="Stop generating"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ef4444]/15 text-[#ef4444] transition-colors duration-150 hover:bg-[#ef4444]/25"
          >
            <Square className="size-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isDisabled}
            title="Send message"
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
              value.trim()
                ? 'bg-[#f7931a] text-black hover:bg-[#ffaa3b]'
                : 'bg-[#181a1d] text-[#555a65] cursor-not-allowed',
            )}
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
