'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Send, Square, Brain } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';

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
    <div
      className="relative px-4 py-3"
      style={{
        background: 'var(--bg-sub-surface)',
        borderTop: '1px solid var(--divider-primary)',
      }}
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        {/* Deep Think toggle */}
        <button
          type="button"
          onClick={toggleDeepThink}
          title={deepThink ? 'Deep Think enabled' : 'Enable Deep Think'}
          className="flex size-9 shrink-0 items-center justify-center transition-colors duration-150"
          style={{
            borderRadius: 'var(--radius-md)',
            background: deepThink
              ? 'var(--brand-bg-muted)'
              : 'var(--bg-input)',
            border: '1px solid',
            borderColor: deepThink
              ? 'var(--brand-border-muted)'
              : 'var(--divider-primary)',
            color: deepThink ? 'var(--brand-text)' : 'var(--text-tertiary)',
          }}
        >
          <Brain className="size-4" />
        </button>

        {/* Input */}
        <div
          className="relative flex flex-1 items-end px-3 py-2 transition-colors duration-150"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--divider-primary)',
            borderRadius: 'var(--radius-md)',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand-border)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--divider-primary)';
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Saraswati anything about crypto..."
            disabled={isDisabled}
            rows={1}
            className="max-h-[160px] min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Send / Stop */}
        {isStreaming ? (
          <button
            type="button"
            onClick={abortStream}
            title="Stop generating"
            className="flex size-9 shrink-0 items-center justify-center transition-colors duration-150"
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--negative-bg-muted)',
              color: 'var(--negative-text)',
            }}
          >
            <Square className="size-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isDisabled}
            title="Send message"
            className="flex shrink-0 items-center justify-center transition-colors duration-150"
            style={{
              padding: '8px 16px',
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: value.trim()
                ? 'var(--brand-bg)'
                : 'var(--bg-input)',
              color: value.trim()
                ? 'var(--text-on-bg)'
                : 'var(--text-tertiary)',
              cursor: value.trim() ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (value.trim())
                e.currentTarget.style.background = 'var(--brand-bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (value.trim())
                e.currentTarget.style.background = 'var(--brand-bg)';
            }}
          >
            <Send className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
