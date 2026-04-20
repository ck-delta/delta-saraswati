'use client';

interface SentimentBadgeProps {
  score: number | null;
  label: string | null;
}

type Sentiment = {
  label: string;
  bg: string;
  text: string;
};

function getSentimentInfo(score: number): Sentiment {
  if (score <= 20)
    return {
      label: 'Very Bearish',
      bg: 'var(--negative-bg-muted)',
      text: 'var(--negative-text)',
    };
  if (score <= 40)
    return {
      label: 'Bearish',
      bg: 'var(--negative-bg-muted)',
      text: 'var(--negative-text)',
    };
  if (score <= 60)
    return {
      label: 'Neutral',
      bg: 'var(--bg-secondary)',
      text: 'var(--text-secondary)',
    };
  if (score <= 80)
    return {
      label: 'Bullish',
      bg: 'var(--positive-bg-muted)',
      text: 'var(--positive-text)',
    };
  return {
    label: 'Very Bullish',
    bg: 'var(--positive-bg-muted)',
    text: 'var(--positive-text)',
  };
}

/**
 * Sentiment pill — semantic bg + text.
 */
export default function SentimentBadge({ score, label }: SentimentBadgeProps) {
  if (score == null) {
    return (
      <span
        className="inline-flex items-center text-xs font-medium"
        style={{
          padding: '4px 10px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        &mdash;
      </span>
    );
  }

  const info = getSentimentInfo(score);
  const displayLabel = label ?? info.label;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      style={{
        padding: '4px 10px',
        background: info.bg,
        color: info.text,
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <span className="font-mono-num font-bold">{score}</span>
      <span>{displayLabel}</span>
    </span>
  );
}
