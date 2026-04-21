// Upcoming macro events that matter for crypto.
// Update this list quarterly — Fed & BLS publish schedules months in advance.
// Dates in ISO 8601 UTC.

export interface MacroEvent {
  kind: 'FOMC' | 'CPI' | 'PCE' | 'NFP' | 'FOMC_MINUTES';
  label: string;
  datetime: string; // ISO 8601 UTC
  note?: string;
}

// As of 2026-04-21. Pulled from federalreserve.gov and bls.gov calendars.
// Replace / extend quarterly.
const EVENTS: MacroEvent[] = [
  { kind: 'FOMC_MINUTES', label: 'FOMC Minutes (Mar meeting)', datetime: '2026-04-09T18:00:00Z' },
  { kind: 'CPI',          label: 'US CPI (March)',            datetime: '2026-04-10T12:30:00Z' },
  { kind: 'PCE',          label: 'Core PCE (March)',          datetime: '2026-04-30T12:30:00Z' },
  { kind: 'NFP',          label: 'US Non-Farm Payrolls (April)', datetime: '2026-05-02T12:30:00Z' },
  { kind: 'FOMC',         label: 'FOMC Rate Decision',        datetime: '2026-05-07T18:00:00Z' },
  { kind: 'CPI',          label: 'US CPI (April)',            datetime: '2026-05-13T12:30:00Z' },
  { kind: 'PCE',          label: 'Core PCE (April)',          datetime: '2026-05-30T12:30:00Z' },
  { kind: 'NFP',          label: 'US Non-Farm Payrolls (May)', datetime: '2026-06-05T12:30:00Z' },
  { kind: 'CPI',          label: 'US CPI (May)',              datetime: '2026-06-11T12:30:00Z' },
  { kind: 'FOMC',         label: 'FOMC Rate Decision',        datetime: '2026-06-18T18:00:00Z' },
  { kind: 'PCE',          label: 'Core PCE (May)',            datetime: '2026-06-27T12:30:00Z' },
  { kind: 'NFP',          label: 'US Non-Farm Payrolls (June)', datetime: '2026-07-03T12:30:00Z' },
  { kind: 'CPI',          label: 'US CPI (June)',             datetime: '2026-07-15T12:30:00Z' },
  { kind: 'FOMC',         label: 'FOMC Rate Decision',        datetime: '2026-07-30T18:00:00Z' },
  { kind: 'PCE',          label: 'Core PCE (June)',           datetime: '2026-07-31T12:30:00Z' },
  { kind: 'NFP',          label: 'US Non-Farm Payrolls (July)', datetime: '2026-08-07T12:30:00Z' },
  { kind: 'CPI',          label: 'US CPI (July)',             datetime: '2026-08-12T12:30:00Z' },
  { kind: 'PCE',          label: 'Core PCE (July)',           datetime: '2026-08-28T12:30:00Z' },
  { kind: 'NFP',          label: 'US Non-Farm Payrolls (August)', datetime: '2026-09-04T12:30:00Z' },
  { kind: 'CPI',          label: 'US CPI (August)',           datetime: '2026-09-10T12:30:00Z' },
  { kind: 'FOMC',         label: 'FOMC Rate Decision',        datetime: '2026-09-17T18:00:00Z' },
];

/**
 * Return the next upcoming event of each kind after `now`.
 * Returns at most one per kind. Events already passed are skipped.
 */
export function nextEvents(now: Date = new Date()): MacroEvent[] {
  const future = EVENTS.filter((e) => new Date(e.datetime) > now);
  const byKind = new Map<MacroEvent['kind'], MacroEvent>();
  for (const e of future) {
    if (!byKind.has(e.kind)) byKind.set(e.kind, e);
  }
  return Array.from(byKind.values()).sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );
}

/**
 * Return the next N upcoming events (chronological, any kind).
 * Used by the expandable macro modal.
 */
export function upcomingEvents(limit = 10, now: Date = new Date()): MacroEvent[] {
  return EVENTS
    .filter((e) => new Date(e.datetime) > now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, limit);
}

/** Human-friendly countdown like "3d 4h" or "14h". */
export function countdownLabel(targetIso: string, now: Date = new Date()): string {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (diffMs < 0) return 'past';
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 2) return `${days}d`;
  if (days === 1) return `1d ${hours - 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diffMs / 60_000);
  return `${mins}m`;
}
