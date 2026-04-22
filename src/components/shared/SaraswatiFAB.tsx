'use client';

// Floating Saraswati assistant.
// - Circular ✦ FAB anchored bottom-right on every page except /chat.
// - Click (or ⌘K / Ctrl+K) opens a floating input strip above the FAB.
// - The strip greets the user contextually (token / home / generic) and
//   surfaces 3 page-aware quick-action pills.
// - Submitting a query (or picking a pill) calls the shared chat store's
//   sendMessage, persisting the conversation to localStorage, then
//   navigates to /chat so the user sees the streaming reply.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Send, X } from 'lucide-react';
import { useChatStore } from '@/stores/chat-store';
import { TOKEN_INFO } from '@/lib/constants';

interface QuickAction {
  label: string;
  prompt: string;
  contextType: string;
  tokenSymbol?: string;
}

function tokenPills(symbol: string): QuickAction[] {
  const info = TOKEN_INFO[symbol];
  const under = symbol.replace(/USDT?$/, '');
  const name = info?.name ?? under;
  return [
    {
      label: `Why is the AI Signal what it is?`,
      prompt: `Explain why Saraswati's AI Signal on ${name} (${symbol}) is currently at its level. Walk me through the News, Technical and Derivatives sub-scores that drive it.`,
      contextType: 'general',
      tokenSymbol: symbol,
    },
    {
      label: 'Explain the Bull scenario',
      prompt: `Explain the Bull scenario for ${name} (${symbol}). What are the entry, TP, SL and the invalidation level?`,
      contextType: 'general',
      tokenSymbol: symbol,
    },
    {
      label: `What's the funding state?`,
      prompt: `What's the current funding state for ${name} (${symbol})? How crowded is positioning and what's the contrarian read?`,
      contextType: 'funding',
      tokenSymbol: symbol,
    },
  ];
}

const HOME_PILLS: QuickAction[] = [
  {
    label: "Summarise today's market",
    prompt: "Summarise today's crypto market. Include major token moves, news drivers, funding regime, and any signals worth acting on.",
    contextType: 'market_overview',
  },
  {
    label: 'Top Buy signals right now',
    prompt: "Which tokens on Delta have the strongest Buy signals right now? Explain the top 2-3.",
    contextType: 'gainers_losers',
  },
  {
    label: "What's driving the news?",
    prompt: 'Summarise the most important crypto-market news in the last 24 hours and what it means for BTC/ETH.',
    contextType: 'news',
  },
];

const GENERIC_PILLS: QuickAction[] = [
  { label: 'Market overview',    prompt: 'Give me a snapshot of the crypto market right now.',                  contextType: 'market_overview' },
  { label: 'Funding rates',      prompt: 'Summarise current funding rates and what they imply.',                 contextType: 'funding' },
  { label: "Today's top news",   prompt: "Summarise today's highest-impact crypto news.",                         contextType: 'news' },
];

export default function SaraswatiFAB() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sendMessage = useChatStore((s) => s.sendMessage);
  const hydrate = useChatStore((s) => s.hydrate);
  const hydrated = useChatStore((s) => s.hydrated);
  const createConversation = useChatStore((s) => s.createConversation);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate chat store once (safe when /chat hasn't been visited yet).
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Derive context from the current route.
  const tokenParam = searchParams.get('token');
  const onResearch = pathname.startsWith('/research') && tokenParam;
  const onHome = pathname === '/';
  const onChat = pathname.startsWith('/chat');

  const { greeting, pills } = useMemo(() => {
    if (onResearch && tokenParam) {
      const info = TOKEN_INFO[tokenParam];
      const name = info?.name ?? tokenParam.replace(/USDT?$/, '');
      return { greeting: `Researching ${name} — ask me anything`, pills: tokenPills(tokenParam) };
    }
    if (onHome) {
      return { greeting: 'Hi, I&apos;m Saraswati. How can I help?', pills: HOME_PILLS };
    }
    return { greeting: 'Ask Saraswati anything about the crypto markets', pills: GENERIC_PILLS };
  }, [onResearch, onHome, tokenParam]);

  // ⌘K / Ctrl+K shortcut + Escape to close + focus input on open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const submit = useCallback(
    async (content: string, contextType: string, tokenSymbol?: string) => {
      if (!content.trim() || submitting) return;
      setSubmitting(true);

      // Start a fresh conversation each time the FAB is used so the new reply
      // lands at the top of the chat history. Existing conversations are kept.
      createConversation();

      // Page-aware context enrichment: if we're on /research, bake the token
      // symbol into the server-side prompt via the 'context' field.
      const context = tokenSymbol
        ? { type: contextType, tokenSymbol }
        : { type: contextType };

      // Fire the request — sendMessage streams into the chat store. Navigate
      // immediately so the user sees the answer arrive on /chat.
      void sendMessage(content, context);
      router.push('/chat');
      setOpen(false);
      setQuery('');
      setSubmitting(false);
    },
    [createConversation, sendMessage, router, submitting],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const ctx = onResearch && tokenParam ? 'general' : onHome ? 'market_overview' : 'general';
      submit(query, ctx, onResearch && tokenParam ? tokenParam : undefined);
    },
    [query, onResearch, onHome, tokenParam, submit],
  );

  if (onChat) return null;

  return (
    <>
      {/* Scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
          aria-hidden
        />
      )}

      <div ref={containerRef}>
        {/* ---- Input strip (expanded) ---- */}
        {open && (
          <div
            role="dialog"
            aria-label="Ask Saraswati"
            className="fixed z-50 rounded-2xl p-3.5 shadow-2xl"
            style={{
              right: 24,
              bottom: 96,
              width: 'min(440px, calc(100vw - 48px))',
              background: 'linear-gradient(180deg, #171923 0%, #121319 100%)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.6), 0 0 24px -8px rgba(167, 139, 250, 0.35)',
            }}
          >
            {/* Greeting */}
            <div className="flex items-center justify-between px-1 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ color: '#A78BFA' }}>✦</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cbcfd7]">
                  {greeting}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-6 w-6 items-center justify-center rounded-md text-[#8b8f99] hover:text-[#eaedf3] hover:bg-white/[0.05] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {pills.map((p, i) => (
                <button
                  key={i}
                  onClick={() => submit(p.prompt, p.contextType, p.tokenSymbol)}
                  disabled={submitting}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: 'rgba(167, 139, 250, 0.08)',
                    color: '#C4B5FD',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  onResearch && tokenParam
                    ? `Ask about ${tokenParam.replace(/USDT?$/, '')}…`
                    : 'Ask Saraswati anything…'
                }
                className="flex-1 h-9 px-3 text-sm text-[#eaedf3] placeholder:text-[#555a65] outline-none rounded-lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!query.trim() || submitting}
                aria-label="Send"
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #A78BFA 0%, #7856FF 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 16px -4px rgba(120, 86, 255, 0.6)',
                }}
              >
                <Send size={14} />
              </button>
            </form>

            {/* Footer hint */}
            <div className="flex items-center justify-between pt-2 px-1 text-[10px] text-[#555a65]">
              <span>Replies appear in Chat · conversation is saved</span>
              <span className="font-mono">⌘K to toggle</span>
            </div>
          </div>
        )}

        {/* ---- FAB button (always present when not on /chat) ---- */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close Saraswati' : 'Ask Saraswati'}
          title={open ? 'Close' : 'Ask Saraswati (⌘K)'}
          className="group fixed z-50 flex items-center justify-center rounded-full transition-all"
          style={{
            right: 24,
            bottom: 24,
            width: 56,
            height: 56,
            background: open
              ? 'linear-gradient(135deg, #7856FF 0%, #5B44BB 100%)'
              : 'linear-gradient(135deg, #A78BFA 0%, #7856FF 100%)',
            boxShadow:
              '0 12px 32px -8px rgba(120, 86, 255, 0.65), 0 0 0 1px rgba(167, 139, 250, 0.3) inset, 0 1px 0 rgba(255,255,255,0.2) inset',
            color: '#fff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {open ? (
            <X size={22} />
          ) : (
            <span
              className="text-2xl leading-none"
              style={{
                textShadow: '0 0 12px rgba(255, 255, 255, 0.5)',
                animation: 'saraswati-breathe 4s ease-in-out infinite',
              }}
              aria-hidden
            >
              ✦
            </span>
          )}
          {/* Subtle orbit ring when idle */}
          {!open && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                animation: 'saraswati-orbit 6s linear infinite',
              }}
            />
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes saraswati-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.94); }
        }
        @keyframes saraswati-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
