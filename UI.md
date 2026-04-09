# Delta Saraswati — UI Specification

## Design Reference
See `DESIGN.md` for the complete color system, typography, spacing, and premium details.

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface layers (blue-tinted slate)
        background: "#08080c",
        surface: "#0f1016",
        card: "#12141c",
        elevated: "#1a1c26",
        active: "#252838",

        // Brand accent (amber-orange)
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#FBBF24",
          active: "#D97706",
          muted: "rgba(245,158,11,0.12)",
          subtle: "rgba(245,158,11,0.06)",
        },

        // Trading colors (Binance standard)
        gain: {
          DEFAULT: "#0ECB81",
          text: "#2DD4A0",
          muted: "rgba(14,203,129,0.12)",
        },
        loss: {
          DEFAULT: "#F6465D",
          text: "#FF6B7A",
          muted: "rgba(246,70,93,0.12)",
        },

        // Semantic
        info: { DEFAULT: "#3B82F6", muted: "rgba(59,130,246,0.12)" },
        warning: { DEFAULT: "#FBBF24", muted: "rgba(251,191,36,0.12)" },
        danger: { DEFAULT: "#F6465D", muted: "rgba(246,70,93,0.12)" },
        success: { DEFAULT: "#0ECB81", muted: "rgba(14,203,129,0.12)" },

        // Text
        "text-primary": "#F2F2F7",
        "text-secondary": "#8E8E93",
        "text-tertiary": "#636366",
        "text-disabled": "#48484A",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "SF Pro Display", "-apple-system", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },

      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },

      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.2)",
        sm: "0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)",
        md: "0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)",
        lg: "0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)",
        xl: "0 16px 48px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)",
        "glow-sm": "0 0 12px rgba(245,158,11,0.08)",
        "glow-md": "0 0 24px rgba(245,158,11,0.10)",
        "glow-lg": "0 0 48px rgba(245,158,11,0.12)",
      },

      keyframes: {
        "flash-green": {
          "0%": { backgroundColor: "transparent" },
          "20%": { backgroundColor: "rgba(14, 203, 129, 0.15)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-red": {
          "0%": { backgroundColor: "transparent" },
          "20%": { backgroundColor: "rgba(246, 70, 93, 0.15)" },
          "100%": { backgroundColor: "transparent" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "typing-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
        },
      },

      animation: {
        "flash-green": "flash-green 0.6s ease-out",
        "flash-red": "flash-red 0.6s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "typing-bounce": "typing-bounce 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## shadcn/ui Theme (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 230 20% 4%;         /* #08080c */
    --foreground: 240 5% 96%;         /* #F2F2F7 */
    --card: 228 21% 9%;              /* #12141c */
    --card-foreground: 240 5% 96%;
    --popover: 228 21% 9%;
    --popover-foreground: 240 5% 96%;
    --primary: 38 92% 50%;            /* #F59E0B */
    --primary-foreground: 240 20% 4%; /* dark text on orange */
    --secondary: 228 19% 13%;        /* #1a1c26 */
    --secondary-foreground: 240 5% 96%;
    --muted: 228 19% 13%;
    --muted-foreground: 240 4% 56%;   /* #8E8E93 */
    --accent: 38 92% 50%;
    --accent-foreground: 240 20% 4%;
    --destructive: 354 80% 63%;       /* #F6465D */
    --destructive-foreground: 240 5% 96%;
    --border: 228 15% 12%;
    --input: 228 15% 12%;
    --ring: 38 92% 50%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border/60; }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }
}

/* Premium details */
::selection { background: rgba(245, 158, 11, 0.3); color: #fff; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

/* Skeleton shimmer */
.animate-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
}

/* Gradient separator */
.gradient-separator {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
}

/* Noise texture overlay */
.noise-overlay::after {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Ambient page glow */
.ambient-glow {
  background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.04), transparent);
}

/* Tabular numbers for price data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-flash-green, .animate-flash-red, .animate-shimmer, .animate-typing-bounce {
    animation: none !important;
  }
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| `mobile` | < 768px | Single column, bottom nav, no sidebar |
| `tablet` | 768px - 1024px | Collapsed sidebar (icons only, 64px), 2-col |
| `desktop` | > 1024px | Full sidebar (240px), multi-col |

---

## Page Layouts

### Root Layout

```
Desktop:
┌─────────────────────────────────────────────────────┐
│ Header (56px)  Logo | Title | Deposit | Avatar      │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content (scrollable)                │
│ (240px)  │                                          │
│ Home     │                                          │
│ Research │                                          │
│ Chat     │                                          │
└──────────┴──────────────────────────────────────────┘

Mobile:
┌─────────────────────┐
│ Header (56px)        │
├─────────────────────┤
│ Content (full width) │
├─────────────────────┤
│ Bottom Nav (64px)    │
└─────────────────────┘
```

---

## Page Components

### Home — "Daily Pulse"

```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ BTC      │ │ ETH      │ │ SOL      │  Top 3   │
│ │ $71,151  │ │ $2,181   │ │ $82.18   │  by vol  │
│ │ ▼ -1.06% │ │ ▼ -3.22% │ │ ▼ -2.83% │          │
│ │ F&G: 14  │ │ F&G: 14  │ │ F&G: 14  │          │
│ │ Sent: 35 │ │ Sent: 28 │ │ Sent: 42 │          │
│ │[Info][Trd]│ │[Info][Trd]│ │[Info][Trd]│          │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ AI Market Summary (24h)                        ││
│ │ "Bitcoin traded sideways near $71K..."         ││
│ └────────────────────────────────────────────────┘│
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ ● BTC drops below $72K...         🟢 Positive ││
│ │ ● FED signals rate hold...        🔴 Negative ││
│ │ ● Ethereum L2 TVL hits...         🟢 Positive ││
│ └────────────────────────────────────────────────┘│
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ Explore the latest trends    [Trade Now →]     ││
│ └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Research Tab

```
┌──────────────────────────────────────────────────┐
│ [🔍 Search token...                    ▼ BTCUSD] │
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ Candlestick Chart    [1H] [4H] [1D] [1W]      ││
│ │ (TradingView Lightweight Charts, 400px)        ││
│ └────────────────────────────────────────────────┘│
│                                                  │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                 │
│ │Price│ │24h %│ │Vol  │ │OI   │  Stat Cards     │
│ └─────┘ └─────┘ └─────┘ └─────┘                 │
│                                                  │
│ ┌───────────────┐ ┌─────────────────────────────┐│
│ │ Technical     │ │ Derivatives                  ││
│ │ RSI / MACD    │ │ Funding / OI / Basis         ││
│ └───────────────┘ └─────────────────────────────┘│
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ Ask about BTCUSD...                     [Send] ││
│ └────────────────────────────────────────────────┘│
│                          [Trade Now on Delta →]  │
└──────────────────────────────────────────────────┘
```

### Chat Tab

```
┌──────────────────────────────────────────────────┐
│ [Market Overview][Top Gainers][Losers][News][...]  │
│                                                  │
│   Welcome: "I'm Delta Saraswati..."              │
│                                                  │
│   ┌──────────────────────────────────┐           │
│   │ User: What's the market like?    │           │
│   └──────────────────────────────────┘           │
│   ┌──────────────────────────────────┐           │
│   │ AI: Bitcoin is trading at...      │           │
│   └──────────────────────────────────┘           │
│                                                  │
│ ┌────────────────────────────────────────────────┐│
│ │ Ask anything about crypto...            [Send] ││
│ └────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## Component Interfaces

### TokenCard

```typescript
interface TokenCardProps {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
  fearGreedValue: number;
  fearGreedLabel: string;
  sentimentScore: number;
  sentimentExplanation: string;
  fundingRate: number;
  volume24h: number;
  onMoreInfo: () => void;
  onTradeNow: () => void;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}
```

### QuickAction

```typescript
interface QuickAction {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
}
```

### NewsHeadline

```typescript
interface NewsHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
}
```

---

## Chart Integration

### TradingView Lightweight Charts

```typescript
const chart = createChart(container, {
  layout: { background: { color: "#12141c" }, textColor: "rgba(255,255,255,0.35)" },
  grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
  crosshair: { mode: CrosshairMode.Normal },
  timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
  rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
});

const candlestick = chart.addCandlestickSeries({
  upColor: "#0ECB81", downColor: "#F6465D",
  borderUpColor: "#0ECB81", borderDownColor: "#F6465D",
  wickUpColor: "#0ECB81", wickDownColor: "#F6465D",
});
```

### Recharts Theme

```typescript
const chartTheme = {
  gain: "#0ECB81",
  loss: "#F6465D",
  accent: "#F59E0B",
  grid: "rgba(255,255,255,0.04)",
  text: "rgba(255,255,255,0.35)",
  volume: { up: "rgba(14,203,129,0.25)", down: "rgba(246,70,93,0.25)" },
};
```

---

## shadcn/ui Components

| Component | Customization |
|-----------|---------------|
| Button | amber primary (dark text), ghost with accent border |
| Card | `#12141c` bg, rgba border, 12px radius |
| Badge | gain/loss/accent/neutral variants |
| Dialog | Trade Now modal, scale-in animation |
| Input | inset shadow, amber focus ring |
| Select | Token selector dropdown |
| Skeleton | shimmer gradient on card bg |
| Tooltip | Sentiment explanations |
| ScrollArea | Chat messages, custom scrollbar |
| Separator | Gradient fade variant |
