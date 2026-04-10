'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatRelativeTime } from '@/lib/format';

/* ------------------------------------------------------------------ */
/*  Lightweight Markdown renderer                                     */
/*  Supports: **bold**, *italic*, `inline code`, ```code blocks```,   */
/*            ### headings, - bullet lists, 1. numbered lists          */
/* ------------------------------------------------------------------ */

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
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={key++}
          className="my-2 overflow-x-auto rounded-lg border border-[#1e2024] bg-[#08090a] p-3 font-mono text-sm text-[#eaedf3]"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Heading
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
        <Tag key={key++} className={`${sizeClass} mt-3 mb-1 text-[#eaedf3]`}>
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
          <li key={key++} className="ml-4 list-disc text-[#eaedf3]/90">
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
          <li key={key++} className="ml-4 list-decimal text-[#eaedf3]/90">
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

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={key++} className="text-[#eaedf3]/90 leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partKey = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderPriceNumbers(text.slice(lastIndex, match.index), partKey++));
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={`b-${partKey++}`} className="font-semibold text-[#eaedf3]">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={`i-${partKey++}`} className="italic text-[#eaedf3]/80">
          {match[4]}
        </em>,
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code
          key={`c-${partKey++}`}
          className="rounded bg-[#08090a] border border-[#1e2024] px-1.5 py-0.5 font-mono text-xs text-[#f7931a]"
        >
          {match[6]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderPriceNumbers(text.slice(lastIndex), partKey++));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function renderPriceNumbers(text: string, baseKey: number): React.ReactNode {
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
      <span key={`pn-${baseKey}-${k++}`} className="font-mono text-[#eaedf3]">
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

/* ------------------------------------------------------------------ */
/*  ChatMessage component                                             */
/* ------------------------------------------------------------------ */

interface ChatMessageProps {
  message: ChatMessageType;
}

function ChatMessageInner({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDuration: '200ms' }}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-[#f7931a]/10 border border-[#f7931a]/20 px-4 py-3'
            : 'rounded-2xl rounded-bl-md bg-[#111214] border border-[#1e2024] px-4 py-3'
        }`}
      >
        {/* Assistant label */}
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="size-5 rounded-full bg-gradient-to-br from-[#f7931a] to-[#ffaa3b] flex items-center justify-center">
              <span className="text-[10px] font-bold text-black">S</span>
            </div>
            <span className="text-xs font-medium text-[#f7931a]">Saraswati</span>
          </div>
        )}

        {/* Message content */}
        <div className={`text-sm ${isUser ? 'text-[#eaedf3]' : ''}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[#eaedf3]">{message.content}</p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          )}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[#f7931a]" />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`mt-1.5 text-[10px] text-[#555a65] ${isUser ? 'text-right' : 'text-left'}`}
        >
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = React.memo(ChatMessageInner);
