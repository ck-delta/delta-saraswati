'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { formatRelativeTime } from '@/lib/format';

/* ------------------------------------------------------------------ */
/*  Lightweight Markdown renderer                                     */
/* ------------------------------------------------------------------ */

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

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
          className="my-2 overflow-x-auto p-3 font-mono text-sm"
          style={{
            background: 'var(--bg-sub-surface)',
            border: '1px solid var(--divider-primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

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
        <Tag
          key={key++}
          className={`${sizeClass} mt-3 mb-1`}
          style={{ color: 'var(--text-primary)' }}
        >
          {renderInline(headingText)}
        </Tag>,
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
        listItems.push(
          <li
            key={key++}
            className="ml-4 list-disc"
            style={{ color: 'var(--text-primary)' }}
          >
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

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        listItems.push(
          <li
            key={key++}
            className="ml-4 list-decimal"
            style={{ color: 'var(--text-primary)' }}
          >
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

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }

    elements.push(
      <p
        key={key++}
        className="leading-relaxed"
        style={{ color: 'var(--text-primary)' }}
      >
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
      parts.push(
        renderPriceNumbers(text.slice(lastIndex, match.index), partKey++),
      );
    }

    if (match[1]) {
      parts.push(
        <strong
          key={`b-${partKey++}`}
          className="font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      parts.push(
        <em
          key={`i-${partKey++}`}
          className="italic"
          style={{ color: 'var(--text-secondary)' }}
        >
          {match[4]}
        </em>,
      );
    } else if (match[5]) {
      parts.push(
        <code
          key={`c-${partKey++}`}
          className="font-mono text-xs px-1.5 py-0.5"
          style={{
            background: 'var(--bg-sub-surface)',
            border: '1px solid var(--divider-primary)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--brand-text)',
          }}
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
      <span
        key={`pn-${baseKey}-${k++}`}
        className="font-mono-num"
        style={{ color: 'var(--text-primary)' }}
      >
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
/*  ChatMessage                                                       */
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
        className="max-w-[85%] md:max-w-[75%]"
        style={{
          padding: '12px 16px',
          background: isUser ? 'var(--brand-bg)' : 'var(--bg-primary)',
          color: isUser ? 'var(--text-on-bg)' : 'var(--text-primary)',
          border: isUser ? 'none' : '1px solid var(--bg-secondary)',
          borderRadius: isUser
            ? '12px 12px 2px 12px'
            : '12px 12px 12px 2px',
        }}
      >
        {/* Assistant label */}
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 20,
                height: 20,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--brand-bg)',
              }}
            >
              <span
                className="text-[10px] font-bold"
                style={{ color: 'var(--text-on-bg)' }}
              >
                S
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--brand-text)' }}
            >
              Saraswati
            </span>
          </div>
        )}

        {/* Message content */}
        <div className="text-sm">
          {isUser ? (
            <p
              className="whitespace-pre-wrap"
              style={{ color: 'var(--text-on-bg)' }}
            >
              {message.content}
            </p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          )}
          {message.isStreaming && (
            <span
              className="ml-0.5 inline-block h-4 w-1.5 animate-pulse"
              style={{
                background: 'var(--brand-bg)',
                borderRadius: 'var(--radius-xs)',
              }}
            />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`mt-1.5 text-[10px] ${isUser ? 'text-right' : 'text-left'}`}
          style={{
            color: isUser
              ? 'rgba(255,255,255,0.7)'
              : 'var(--text-tertiary)',
          }}
        >
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = React.memo(ChatMessageInner);
