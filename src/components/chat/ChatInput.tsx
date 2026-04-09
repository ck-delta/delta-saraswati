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

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    // Clamp between 1 line (~40px) and 5 lines (~160px)
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
    // Reset textarea height after clearing
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
    <div className="border-t border-[#2a2a32] bg-[#101013] px-4 pb-3 pt-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        {/* Deep Think toggle */}
        <button
          type="button"
          onClick={toggleDeepThink}
          title={deepThink ? 'Deep Think enabled' : 'Enable Deep Think'}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
            deepThink
              ? 'border-[#fd7d02]/50 bg-[#fd7d02]/15 text-[#fd7d02] shadow-[0_0_8px_rgba(253,125,2,0.25)]'
              : 'border-[#2a2a32] bg-[#1a1a1f] text-[#6b7280] hover:text-[#9ca3af]',
          )}
        >
          <Brain className="size-4" />
        </button>

        {/* Input area */}
        <div className="relative flex flex-1 items-end rounded-xl border border-[#2a2a32] bg-[#1a1a1f] px-3 py-2 focus-within:border-[#fd7d02]/50">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Saraswati anything about crypto..."
            disabled={isDisabled}
            rows={1}
            className="max-h-[160px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-white placeholder-[#6b7280] outline-none disabled:opacity-50"
          />
        </div>

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={abortStream}
            title="Stop generating"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#ff4d4f]/15 text-[#ff4d4f] transition-colors hover:bg-[#ff4d4f]/25"
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
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
              value.trim()
                ? 'bg-[#fd7d02] text-black hover:bg-[#ff9a3e]'
                : 'bg-[#222228] text-[#6b7280] cursor-not-allowed',
            )}
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
