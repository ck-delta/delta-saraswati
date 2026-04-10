"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { Zap } from "lucide-react";

export function CtaBanner() {
  const openTradeModal = useAppStore((s) => s.openTradeModal);

  return (
    <Card className="relative overflow-hidden ambient-glow border-primary/10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent pointer-events-none" />
      <CardContent className="relative flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">
            Ready to trade?
          </h3>
          <p className="text-sm text-text-secondary">
            Start trading futures &amp; options on Delta Exchange
          </p>
        </div>
        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-glow-md)] transition-shadow"
          onClick={() => openTradeModal("BTC")}
        >
          <Zap className="size-4 mr-1.5" />
          Trade Now
        </Button>
      </CardContent>
    </Card>
  );
}
