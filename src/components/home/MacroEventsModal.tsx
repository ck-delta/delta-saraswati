'use client';

// Modal listing the next 10 upcoming macro events. Triggered from the Macro
// Calendar tile in MarketMoodBar.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon } from './MoodIcons';
import type { MarketMood } from '@/app/api/market-mood/route';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: MarketMood['upcomingMacroEvents'];
}

const KIND_STYLE: Record<string, { color: string; bg: string; label: string; blurb: string }> = {
  FOMC:          { color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.10)',  label: 'FOMC',         blurb: 'Fed rate decision' },
  FOMC_MINUTES:  { color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.08)',  label: 'FOMC Minutes', blurb: 'Prior-meeting minutes' },
  CPI:           { color: '#F87171', bg: 'rgba(248, 113, 113, 0.10)', label: 'CPI',          blurb: 'Consumer inflation' },
  PCE:           { color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.10)', label: 'PCE',          blurb: "Fed's preferred inflation gauge" },
  NFP:           { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.10)',  label: 'NFP',          blurb: 'US jobs report' },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

export default function MacroEventsModal({ open, onOpenChange, events }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-xl !bg-[#0e0f12] !text-[#eaedf3] !ring-white/[0.08]"
        style={{ padding: 0 }}
      >
        <div className="p-5 space-y-1">
          <div className="flex items-center gap-3">
            <CalendarIcon size={32} color="#22C55E" />
            <div>
              <DialogTitle className="!text-[#eaedf3] !text-base">Upcoming Macro Events</DialogTitle>
              <DialogDescription className="!text-[#8b8f99] !text-xs">
                High-impact US economic data and Fed decisions. All times local to your browser.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto border-t border-white/[0.05]">
          {events.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#8b8f99]">
              No upcoming events in calendar.
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {events.map((e, i) => {
                const style = KIND_STYLE[e.kind] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', label: e.kind, blurb: '' };
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                    {/* Countdown badge */}
                    <div
                      className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[60px]"
                      style={{ background: style.bg, border: `1px solid ${style.color}33` }}
                    >
                      <span className="font-mono-num text-base font-black leading-none" style={{ color: style.color }}>
                        {e.countdown}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: style.color, opacity: 0.75 }}>
                        away
                      </span>
                    </div>

                    {/* Event */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}33` }}
                        >
                          {style.label}
                        </span>
                        <span className="text-sm font-semibold text-[#eaedf3] truncate">
                          {e.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8b8f99] mt-0.5">
                        {fmtDate(e.datetime)} · {fmtTime(e.datetime)}
                        {style.blurb && (
                          <>
                            <span className="text-[#555a65] mx-1.5">·</span>
                            {style.blurb}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.05] text-[10px] text-[#555a65]">
          Calendar maintained quarterly. Data from federalreserve.gov and bls.gov.
        </div>
      </DialogContent>
    </Dialog>
  );
}
