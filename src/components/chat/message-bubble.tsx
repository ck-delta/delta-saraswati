"use client";

import { motion } from "framer-motion";
import { ChatMessage } from "@/types/chat";
import { useMemo } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
}

function renderContent(text: string) {
  // Split into lines and render with basic formatting
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip empty lines but add spacing
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Strip markdown headers (###, ##, #) — just render as bold text
    if (line.match(/^#{1,3}\s+/)) {
      line = line.replace(/^#{1,3}\s+/, "");
      elements.push(
        <p key={i} className="font-semibold text-text-primary mt-2 first:mt-0">
          {formatInline(line)}
        </p>
      );
      continue;
    }

    // Bullet points (- or * or numbered)
    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)/);
    const numberedMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (bulletMatch) {
      elements.push(
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-primary mt-0.5">•</span>
          <span>{formatInline(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }
    if (numberedMatch) {
      const num = line.match(/^\s*(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-primary font-mono text-xs mt-0.5 min-w-[1rem]">{num}.</span>
          <span>{formatInline(numberedMatch[1])}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(<p key={i}>{formatInline(line)}</p>);
  }

  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-text-primary">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      parts.push(
        <em key={match.index} className="italic">
          {match[2]}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const rendered = useMemo(
    () => (isUser ? message.content : renderContent(message.content)),
    [message.content, isUser]
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <motion.div
        initial={{ opacity: 0, x: isUser ? 8 : -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`
          max-w-[85%] px-4 py-3 text-sm leading-relaxed space-y-1
          ${
            isUser
              ? "rounded-2xl rounded-br-md bg-active text-text-primary"
              : "rounded-2xl rounded-bl-md bg-card text-text-secondary"
          }
        `}
      >
        {rendered}
        {message.isStreaming && (
          <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary" />
        )}
      </motion.div>
    </div>
  );
}
