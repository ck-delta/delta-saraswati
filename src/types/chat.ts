// Types for the Chat tab

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  prompt: string; // What to send to the AI
  contextType: 'market_overview' | 'gainers_losers' | 'news' | 'whale' | 'liquidation' | 'funding';
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
  context?: {
    type: string;
    tokenSymbol?: string;
    deepThink?: boolean;
  };
}

export interface StreamChunk {
  type: 'text' | 'error' | 'done';
  content: string;
}
