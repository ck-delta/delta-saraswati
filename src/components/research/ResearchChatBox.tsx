'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface ResearchChatBoxProps {
  tokenSymbol: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ResearchChatBox({ tokenSymbol }: ResearchChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [tokenSymbol]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = input.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = { role: 'user', content: trimmed };

      setMessages((prev) => {
        const last = prev.slice(-2);
        return [...last, userMessage];
      });
      setInput('');
      setIsStreaming(true);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: trimmed }],
            context: {
              type: 'token_research',
              tokenSymbol,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text' && parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: assistantContent,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              if (data && data !== '[DONE]') {
                assistantContent += data;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: assistantContent,
                    };
                  }
                  return updated;
                });
              }
            }
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to get response';
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: `Error: ${errorMsg}`,
            };
          } else {
            updated.push({ role: 'assistant', content: `Error: ${errorMsg}` });
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, tokenSymbol],
  );

  const visibleMessages = messages.slice(-2);

  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#1e2024]">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-[#f7931a]" />
          <span className="text-xs uppercase tracking-wider text-[#555a65]">
            AI Research Assistant
          </span>
        </div>
      </div>

      {/* Messages area */}
      {visibleMessages.length > 0 && (
        <div ref={scrollRef} className="max-h-[200px] overflow-y-auto p-3 space-y-3">
          {visibleMessages.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <div className="shrink-0 mt-0.5">
                {msg.role === 'user' ? (
                  <User className="h-3.5 w-3.5 text-[#8b8f99]" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-[#f7931a]" />
                )}
              </div>
              <div
                className={cn(
                  'text-xs leading-relaxed',
                  msg.role === 'user' ? 'text-[#8b8f99]' : 'text-[#eaedf3]',
                )}
              >
                {msg.content || (
                  <span className="flex items-center gap-1 text-[#555a65]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#1e2024]">
        <div className="relative">
          <input
            ref={inputRef}
            placeholder={`Ask anything about ${tokenSymbol}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            className={cn(
              'w-full pr-10 h-9 px-3 text-xs bg-[#181a1d] border border-[#1e2024] rounded-lg',
              'text-[#eaedf3] placeholder-[#555a65] outline-none',
              'focus:border-[#f7931a]/50 transition-colors duration-150',
              'disabled:opacity-50',
            )}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className={cn(
              'absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md',
              'transition-colors duration-150 cursor-pointer',
              input.trim() && !isStreaming
                ? 'text-[#f7931a] hover:bg-[#f7931a]/10'
                : 'text-[#555a65]',
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
