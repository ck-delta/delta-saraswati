"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Check, ChevronDown, Star, List } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { AnimatedDropdown } from "@/lib/motion/components";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Token {
  symbol: string;
  description: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selected: string | null;
  onSelect: (symbol: string) => void;
}

const POPULAR_SYMBOLS = ["BTCUSD", "ETHUSD", "SOLUSD"];

export function TokenSelector({ tokens, selected, onSelect }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedToken = tokens.find((t) => t.symbol === selected);

  const { popular, rest } = useMemo(() => {
    const query = search.toLowerCase();
    const filtered = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
    const pop = filtered
      .filter((t) => POPULAR_SYMBOLS.includes(t.symbol))
      .sort((a, b) => POPULAR_SYMBOLS.indexOf(a.symbol) - POPULAR_SYMBOLS.indexOf(b.symbol));
    const others = filtered
      .filter((t) => !POPULAR_SYMBOLS.includes(t.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { popular: pop, rest: others };
  }, [tokens, search]);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary transition-colors hover:bg-elevated"
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold">{selected ?? "Select token"}</span>
          {selectedToken && (
            <span className="text-text-tertiary">{selectedToken.description}</span>
          )}
        </span>
        <ChevronDown className="size-4 text-text-tertiary" />
      </button>

      <AnimatedDropdown isOpen={open}>
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="max-h-64">
            {popular.length > 0 && (
              <div className="px-2 pb-1">
                <p className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  <Star className="size-3 text-amber-500" />
                  Popular
                </p>
                {popular.map((token) => (
                  <TokenOption
                    key={token.symbol}
                    token={token}
                    isSelected={token.symbol === selected}
                    onSelect={() => {
                      onSelect(token.symbol);
                      setOpen(false);
                      setSearch("");
                    }}
                  />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="px-2 pb-2">
                {popular.length > 0 && (
                  <p className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <List className="size-3 text-text-tertiary" />
                    All Tokens
                  </p>
                )}
                {rest.map((token) => (
                  <TokenOption
                    key={token.symbol}
                    token={token}
                    isSelected={token.symbol === selected}
                    onSelect={() => {
                      onSelect(token.symbol);
                      setOpen(false);
                      setSearch("");
                    }}
                  />
                ))}
              </div>
            )}

            {popular.length === 0 && rest.length === 0 && (
              <div className="flex flex-col items-center px-4 py-6">
                <Search className="size-4 text-text-tertiary mb-1" />
                <p className="text-center text-sm text-text-tertiary">
                  No tokens found
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function TokenOption({
  token,
  isSelected,
  onSelect,
}: {
  token: Token;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-elevated"
    >
      <span className="flex items-center gap-2">
        <span className="font-medium text-text-primary">{token.symbol}</span>
        <span className="text-xs text-text-tertiary">{token.description}</span>
      </span>
      {isSelected && <Check className="size-3.5 text-primary" />}
    </button>
  );
}
