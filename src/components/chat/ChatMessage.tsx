'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatRelativeTime } from '@/lib/format';

// ---------------------------------------------------------------------------
// Lightweight Markdown renderer (no external deps)
// Supports: **bold**, *italic*, `inline code`, ```code blocks```,
//           ### headings, - bullet lists, 1. numbered lists
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i++; // skip opening fence
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      elements.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded border border-[#2a2a32] bg-[#101013] p-3 font-mono text-sm text-[#e5e7eb]"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Heading (### / ## / #)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const Tag = `h${level + 1}` as keyof React.JSX.IntrinsicElements;
      const sizeClass =
        level === 1
          ? 'text-lg font-bold'
          : level === 2
            ? 'text-base font-semibold'
            : 'text-sm font-semibold';
      elements.push(
        <Tag key={key++} className={`${sizeClass} mt-3 mb-1 text-white`}>
          {renderInline(headingText)}
        </Tag>,
      );
      i++;
      continue;
    }

    // Unordered list item
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
        listItems.push(
          <li key={key++} className="ml-4 list-disc text-[#d1d5db]">
            {renderInline(itemText)}
          </li>,
        );
        i++;
      }
      elements.push(
        <ul key={key++} className="my-1 space-y-0.5">
          {listItems}
        </ul>,
      );
      continue;
    }

    // Ordered list item
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        listItems.push(
          <li key={key++} className="ml-4 list-decimal text-[#d1d5db]">
            {renderInline(itemText)}
          </li>,
        );
        i++;
      }
      elements.push(
        <ol key={key++} className="my-1 space-y-0.5">
          {listItems}
        </ol>,
      );
      continue;
    }

    // Empty line -> spacer
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-[#d1d5db] leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return elements;
}

/**
 * Render inline markdown: **bold**, *italic*, `code`, and price/number detection
 */
function renderInline(text: string): React.ReactNode {
  // Split by inline patterns: **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  // Regex ordering: bold before italic to avoid conflicts
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partKey = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      parts.push(renderPriceNumbers(text.slice(lastIndex, match.index), partKey++));
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={`b-${partKey++}`} className="font-semibold text-white">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={`i-${partKey++}`} className="italic text-[#c9cdd3]">
          {match[4]}
        </em>,
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code
          key={`c-${partKey++}`}
          className="rounded bg-[#101013] px-1.5 py-0.5 font-mono text-xs text-[#fd7d02]"
        >
          {match[6]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(renderPriceNumbers(text.slice(lastIndex), partKey++));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/**
 * Wrap dollar amounts and percentages in monospace spans for readability.
 */
function renderPriceNumbers(text: string, baseKey: number): React.ReactNode {
  // Match $-prefixed numbers or standalone percentages like +5.23%, -2.10%
  const priceRegex = /(\$[\d,]+(?:\.\d+)?|[+-]?\d+(?:\.\d+)?%)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = priceRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    parts.push(
      <span key={`pn-${baseKey}-${k++}`} className="font-mono text-white">
        {m[0]}
      </span>,
    );
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0];
  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// ChatMessage component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
}

function ChatMessageInner({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-[#fd7d02]/10 px-4 py-3'
            : 'rounded-2xl rounded-bl-md bg-[#1a1a1f] px-4 py-3'
        }`}
      >
        {/* Assistant label */}
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="size-5 rounded-full bg-gradient-to-br from-[#fd7d02] to-[#ff9a3e] flex items-center justify-center">
              <span className="text-[10px] font-bold text-black">S</span>
            </div>
            <span className="text-xs font-medium text-[#fd7d02]">Saraswati</span>
          </div>
        )}

        {/* Message content */}
        <div className={`text-sm ${isUser ? 'text-white' : ''}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-white">{message.content}</p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          )}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[#fd7d02]" />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`mt-1.5 text-[10px] text-[#6b7280] ${isUser ? 'text-right' : 'text-left'}`}
        >
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = React.memo(ChatMessageInner);
