import { create } from 'zustand';
import type { ChatMessage, Conversation, ChatRequest, StreamChunk } from '@/types/chat';

// ---------------------------------------------------------------------------
// Chat Store — conversations, streaming, deep-think toggle, localStorage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'delta-saraswati-conversations';
const MAX_CONVERSATIONS = 50;

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Conversation[];
  } catch {
    // Ignore corrupt data
  }
  return [];
}

function persistConversations(conversations: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    // Only keep the most recent conversations
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

interface ChatState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Current messages (derived from active conversation)
  messages: ChatMessage[];

  // Streaming
  isStreaming: boolean;
  streamingContent: string;

  // Settings
  deepThink: boolean;

  // Hydration
  hydrated: boolean;
}

interface ChatActions {
  hydrate: () => void;

  // Conversation management
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Messaging
  sendMessage: (content: string, context?: ChatRequest['context']) => Promise<void>;
  clearMessages: () => void;

  // Settings
  toggleDeepThink: () => void;
  setDeepThink: (enabled: boolean) => void;

  // Abort
  abortStream: () => void;
}

// Module-level abort controller so we can cancel from any action
let abortController: AbortController | null = null;

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // ---------- State ----------
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  deepThink: false,
  hydrated: false,

  // ---------- Actions ----------

  hydrate: () => {
    const conversations = loadConversations();
    const activeId = conversations.length > 0 ? conversations[0].id : null;
    const messages = activeId
      ? conversations.find((c) => c.id === activeId)?.messages ?? []
      : [];
    set({ conversations, activeConversationId: activeId, messages, hydrated: true });
  },

  createConversation: () => {
    const id = generateId();
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const updated = [conv, ...get().conversations];
    persistConversations(updated);
    set({ conversations: updated, activeConversationId: id, messages: [] });
    return id;
  },

  setActiveConversation: (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    set({ activeConversationId: id, messages: conv.messages });
  },

  deleteConversation: (id) => {
    const updated = get().conversations.filter((c) => c.id !== id);
    persistConversations(updated);

    // If we deleted the active conversation, switch to the first remaining one
    let nextId = get().activeConversationId;
    let nextMessages = get().messages;
    if (nextId === id) {
      nextId = updated.length > 0 ? updated[0].id : null;
      nextMessages = nextId ? updated.find((c) => c.id === nextId)?.messages ?? [] : [];
    }
    set({ conversations: updated, activeConversationId: nextId, messages: nextMessages });
  },

  sendMessage: async (content, context) => {
    const state = get();

    // Ensure we have an active conversation
    let convId = state.activeConversationId;
    if (!convId) {
      convId = get().createConversation();
    }

    // Build user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Append user message
    const updatedMessages = [...get().messages, userMsg];
    set({ messages: updatedMessages, isStreaming: true, streamingContent: '' });

    // Update conversation in list
    updateConversationMessages(convId, updatedMessages, content);

    // Prepare request payload: send recent history for context (last 20 messages)
    const history = updatedMessages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload: ChatRequest = {
      messages: history,
      context: context ?? (get().deepThink ? { type: 'deep_think', deepThink: true } : undefined),
    };

    // Create new abort controller
    abortController = new AbortController();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      // Stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });

        // Parse SSE-style chunks or raw text
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          // Try to parse as JSON chunk (SSE data: {...})
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const chunk: StreamChunk = JSON.parse(jsonStr);
              if (chunk.type === 'text') {
                accumulated += chunk.content;
              } else if (chunk.type === 'error') {
                accumulated += `\n\n**Error:** ${chunk.content}`;
              }
            } catch {
              // Not valid JSON — treat as raw text
              accumulated += jsonStr;
            }
          } else {
            // Raw text streaming (non-SSE)
            accumulated += line;
          }
        }

        set({ streamingContent: accumulated });
      }

      // Finalize assistant message
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: accumulated || 'No response received.',
        timestamp: Date.now(),
      };

      const finalMessages = [...get().messages, assistantMsg];
      set({ messages: finalMessages, isStreaming: false, streamingContent: '' });

      // Persist
      const currentConvId = get().activeConversationId;
      if (currentConvId) {
        updateConversationMessages(currentConvId, finalMessages);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — finalize whatever we have
        const partial = get().streamingContent;
        if (partial) {
          const partialMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: partial + '\n\n*(generation stopped)*',
            timestamp: Date.now(),
          };
          const finalMessages = [...get().messages, partialMsg];
          set({ messages: finalMessages, isStreaming: false, streamingContent: '' });
          const currentConvId = get().activeConversationId;
          if (currentConvId) updateConversationMessages(currentConvId, finalMessages);
        } else {
          set({ isStreaming: false, streamingContent: '' });
        }
        return;
      }

      // Append error as system message
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      const finalMessages = [...get().messages, errorMsg];
      set({ messages: finalMessages, isStreaming: false, streamingContent: '' });
      const currentConvId = get().activeConversationId;
      if (currentConvId) updateConversationMessages(currentConvId, finalMessages);
    } finally {
      abortController = null;
    }
  },

  clearMessages: () => {
    const convId = get().activeConversationId;
    if (convId) {
      updateConversationMessages(convId, []);
    }
    set({ messages: [] });
  },

  toggleDeepThink: () => set((s) => ({ deepThink: !s.deepThink })),
  setDeepThink: (enabled) => set({ deepThink: enabled }),

  abortStream: () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateConversationMessages(
  convId: string,
  messages: ChatMessage[],
  titleHint?: string,
) {
  const store = useChatStore.getState();
  const updated = store.conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      messages,
      updatedAt: Date.now(),
      // Auto-set title from first user message
      title:
        c.title === 'New conversation' && titleHint
          ? titleHint.slice(0, 60) + (titleHint.length > 60 ? '...' : '')
          : c.title,
    };
  });
  persistConversations(updated);
  useChatStore.setState({ conversations: updated });
}
