"use client";

import { X, ExternalLink } from "lucide-react";
import { AnimatedModal } from "@/lib/motion/components";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TradeModal() {
  const tradeModalOpen = useAppStore((s) => s.tradeModalOpen);
  const tradeModalToken = useAppStore((s) => s.tradeModalToken);
  const closeTradeModal = useAppStore((s) => s.closeTradeModal);

  return (
    <AnimatedModal isOpen={tradeModalOpen} onClose={closeTradeModal}>
      <Card className="w-[90vw] max-w-md relative">
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3"
          onClick={closeTradeModal}
        >
          <X className="size-4" />
        </Button>

        <CardHeader>
          <CardTitle className="text-lg">
            Trade {tradeModalToken ?? "Token"} on Delta Exchange
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            This is a demo feature. In a production environment, this would
            connect to the Delta Exchange trading interface.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-text-tertiary">
              Trade perpetual futures, options, and more on Delta Exchange with
              up to 100x leverage.
            </p>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
            onClick={() => {
              window.open("https://www.delta.exchange", "_blank");
              closeTradeModal();
            }}
          >
            <ExternalLink className="size-4 mr-1.5" />
            Open Delta Exchange
          </Button>
        </CardContent>
      </Card>
    </AnimatedModal>
  );
}
