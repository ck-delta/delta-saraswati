'use client';

// Top strip of quick-read callouts: Fear & Greed, BTC dominance, next macro
// events, and conditional alerts.

import type { PulseCallouts } from '@/types/pulse';

function fgColor(value: number): string {
  if (value <= 24) return '#EF4444';   // extreme fear
  if (value <= 44) return '#F59E0B';   // fear
  if (value <= 55) return '#FBBF24';   // neutral
  if (value <= 75) return '#84CC16';   // greed
  return '#22C55E';                    // extreme greed
}

export default function PulseCallouts({ callouts }: { callouts: PulseCallouts }) {
  const { fearGreed, btcDominance, nextMacroEvents, alerts } = callouts;
  const hasAnything =
    fearGreed || btcDominance || nextMacroEvents.length > 0 || alerts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ---- Fear & Greed ---- */}
        {fearGreed && (
          <div
            className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3"
          >
            <div className="flex-shrink-0">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg font-mono-num text-base font-black"
                style={{
                  background: `${fgColor(fearGreed.value)}15`,
                  color: fgColor(fearGreed.value),
                  border: `1px solid ${fgColor(fearGreed.value)}40`,
                }}
              >
                {fearGreed.value}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-[#555a65]">Fear & Greed</div>
              <div className="text-xs font-bold" style={{ color: fgColor(fearGreed.value) }}>
                {fearGreed.label.toUpperCase()}
              </div>
              <div className="text-[10px] text-[#8b8f99]">
                {fearGreed.prevValue != null ? (
                  <>
                    {fearGreed.direction === 'up' ? '↑' : fearGreed.direction === 'down' ? '↓' : '→'}{' '}
                    from {fearGreed.prevValue} yesterday
                  </>
                ) : (
                  'macro sentiment'
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- BTC dominance ---- */}
        {btcDominance && (
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg font-mono-num text-sm font-black text-[#F7931A]"
                style={{ background: 'rgba(247,147,26,0.08)', border: '1px solid rgba(247,147,26,0.4)' }}
              >
                {btcDominance.value.toFixed(1)}%
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-[#555a65]">BTC Dominance</div>
              <div className="text-xs font-bold text-[#eaedf3]">
                {btcDominance.value >= 55 ? 'BTC-heavy' : btcDominance.value >= 45 ? 'Balanced' : 'Alt-heavy'}
              </div>
              <div className="text-[10px] text-[#8b8f99]">
                Global mcap {btcDominance.marketCapPctChange24h >= 0 ? '↑' : '↓'} {Math.abs(btcDominance.marketCapPctChange24h).toFixed(2)}% 24h
              </div>
            </div>
          </div>
        )}

        {/* ---- Next macro events ---- */}
        {nextMacroEvents.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3">
            <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-lg text-xl"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}
            >
              ⏱
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-[#555a65]">Macro Calendar</div>
              {nextMacroEvents.slice(0, 2).map((e, i) => (
                <div key={i} className="text-[11px] text-[#eaedf3] truncate">
                  <span className="font-bold" style={{ color: '#4ADE80' }}>{e.countdown}</span>{' '}
                  <span className="text-[#cbcfd7]">{e.kind}</span>
                  <span className="text-[#555a65]"> · {e.label.replace(/ \(.+\)$/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Conditional alert row ---- */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]"
              style={{
                background: a.kind === 'divergence' ? 'rgba(252, 211, 77, 0.08)' : 'rgba(247, 147, 26, 0.08)',
                borderColor: a.kind === 'divergence' ? 'rgba(252, 211, 77, 0.3)' : 'rgba(247, 147, 26, 0.3)',
                color: a.kind === 'divergence' ? '#FCD34D' : '#FBBF24',
              }}
            >
              <span aria-hidden>{a.kind === 'divergence' ? '⚠' : '⚡'}</span>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
