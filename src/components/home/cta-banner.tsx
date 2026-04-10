"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { Zap } from "@/components/icons";

export function CtaBanner() {
  const openTradeModal = useAppStore((s) => s.openTradeModal);

  return (
    <div className="kpi-card rounded-2xl relative overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-primary/[0.02] to-info/[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-primary/20 rounded-l-2xl" />

      <div className="relative flex flex-col items-center gap-4 py-8 px-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">
            Ready to trade?
          </h3>
          <p className="text-sm text-text-secondary">
            Start trading futures &amp; options on Delta Exchange
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-xl font-bold text-primary-foreground trade-btn-shine hover:shadow-[var(--shadow-glow-lg)] transition-all h-12 px-8"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
          onClick={() => openTradeModal("BTC")}
        >
          <Zap className="size-4 mr-2" />
          Trade Now
        </Button>
      </div>
    </div>
  );
}
