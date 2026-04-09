import { cn } from '@/lib/utils';

// Re-export cn for convenience
export { cn };

/**
 * Format a price with commas and appropriate decimal places.
 * Prices >= $1 get 2 decimals; < $1 get up to 6 significant decimals.
 * Always prefixed with $.
 */
export function formatPrice(price: number): string {
  if (price == null || isNaN(price)) return '$--';

  if (price >= 1) {
    return '$' + price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // For sub-dollar prices, show more decimals
  if (price >= 0.01) {
    return '$' + price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }

  return '$' + price.toLocaleString('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

/**
 * Format a percentage with sign and 2 decimal places.
 * e.g. +5.23%, -2.10%
 */
export function formatPercent(pct: number): string {
  if (pct == null || isNaN(pct)) return '--';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Compact large numbers: 1.2B, 450M, 12.5K
 */
export function formatCompact(num: number): string {
  if (num == null || isNaN(num)) return '--';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return sign + (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (abs >= 1_000_000) {
    return sign + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1_000) {
    return sign + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }

  return sign + abs.toFixed(0);
}

/**
 * Format a date/timestamp as relative time: "2h ago", "5min ago", "1d ago".
 * Accepts ISO date strings or Unix timestamps (ms).
 */
export function formatRelativeTime(date: string | number): string {
  if (!date) return '';

  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date;

  if (isNaN(then)) return '';

  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  // Fallback to formatted date
  return new Date(then).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
