# Delta Saraswati — UX Specification

## User Personas

### Primary: Crypto Trader (India)
- Trades on Delta Exchange (perpetual futures, options)
- Wants quick market pulse before trading
- Checks news sentiment, funding rates, technical indicators
- Uses mobile and desktop

### Secondary: Crypto Researcher
- Wants deep analysis on specific tokens
- Asks AI questions about market conditions
- Reads news summaries daily

---

## Navigation

### Sidebar (Desktop)
- Fixed left, 240px wide
- Three items: Home (Daily Pulse), Research, Chat
- Active item: orange text + orange left border accent
- Logo + "Delta Saraswati" at top
- Collapse to icon-only (64px) on tablet

### Bottom Nav (Mobile)
- Fixed bottom, 64px tall
- Three icons: Home, Research, Chat
- Active: orange icon + label
- Inactive: gray icon, no label
- Safe area padding for notched devices

### Route Structure
```
/           → Home (Daily Pulse)
/research   → Research Tab
/chat       → Chat Tab
```

---

## User Flows

### Flow 1: Daily Check-in (Primary)
```
1. User opens app → lands on Home
2. Sees top 3 tokens by volume (cards with price, change, sentiment)
3. Reads AI market summary (30-second scan)
4. Scrolls through news headlines
5. Taps "More Info" on interesting token → Research tab
6. OR taps "Trade Now" → mock modal
```

### Flow 2: Token Research
```
1. User navigates to Research tab
2. Types token name in search → selects from dropdown
3. Views price chart (defaults to 1D candles)
4. Scans indicators panel (RSI, MACD, funding, OI)
5. Asks a question in mini-chat: "Is this a good entry?"
6. AI responds with context-aware analysis
7. Taps "Trade Now on Delta" → mock modal
```

### Flow 3: AI Chat
```
1. User navigates to Chat tab
2. Sees welcome message + quick action pills
3. Taps "Market Overview" → pre-built prompt fires
4. AI streams response with live market data
5. User asks follow-up questions
6. Session is fresh each page load (no history persistence)
```

### Flow 4: Cross-Tab Navigation (Home → Research)
```
1. On Home page, user taps "More Info" on BTC card
2. App navigates to /research
3. Token selector auto-populates with BTCUSD
4. Chart and indicators load for BTC
```

---

## Loading States

### Skeleton Patterns

Every data-driven component has a skeleton state that preserves layout dimensions.

| Component | Skeleton |
|-----------|----------|
| Token Card | Card outline + 4 shimmer lines (price, change, F&G, sentiment) |
| News Summary | Card with 3 shimmer paragraphs |
| News Feed | 5 shimmer rows (title line + badge) |
| Price Chart | Full-height gray box with shimmer |
| Indicators | 2x2 grid of shimmer stat boxes |
| Chat Message | Left-aligned shimmer bubble (3 lines) |

### Shimmer Style
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #1A1A1F 25%,
    #222228 50%,
    #1A1A1F 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Loading Sequence (Home Page)
1. Sidebar + header render immediately (static)
2. Token cards show skeletons → fill in as Delta tickers arrive (~30s cache)
3. News summary skeleton → AI summary loads (may take 2-3s if cache miss)
4. News feed skeleton → headlines load (fast, RSS cache 15min)
5. CTA banner renders immediately (static)

---

## Error States

### API Error Patterns

| Scenario | UI Treatment |
|----------|-------------|
| Delta API down | Show last cached data + orange "Data may be stale" badge |
| CoinGecko rate limit | Use Delta ticker price + hide market cap |
| Groq API error | "AI summary unavailable" card + manual refresh button |
| RSS feed failure | "News temporarily unavailable" + last cached headlines |
| All APIs fail | Full error page: "We're having trouble connecting. Please try again." |

### Error Banner Component
```
┌─────────────────────────────────────────┐
│ ⚠️ Some data may be outdated.  [Retry]  │
└─────────────────────────────────────────┘
```
- Appears at top of main content area
- Orange background with white text
- Auto-dismisses after successful retry
- Shows timestamp of last successful fetch

### Network Offline
```
┌─────────────────────────────────────────┐
│ 📡 You're offline. Showing cached data. │
└─────────────────────────────────────────┘
```

---

## Empty States

### Research Tab (No Token Selected)
```
┌─────────────────────────────────────────┐
│                                         │
│     📊 Select a token to research       │
│                                         │
│     Use the search above to pick any    │
│     Delta Exchange perpetual future     │
│                                         │
│     Popular: [BTC] [ETH] [SOL] [DOGE]   │
│                                         │
└─────────────────────────────────────────┘
```

### Chat Tab (No Messages)
```
┌─────────────────────────────────────────┐
│                                         │
│     🤖 I'm Delta Saraswati             │
│                                         │
│     Your AI crypto research assistant   │
│     powered by live Delta Exchange data │
│                                         │
│     Try asking:                         │
│     • "What's the market like today?"   │
│     • "Analyze BTC funding rates"       │
│     • "Which tokens are pumping?"       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Interaction Patterns

### Polling Feedback
- No visible spinner during background refresh (SWR handles silently)
- Last-updated timestamp shown subtly: "Updated 30s ago"
- On manual refresh: brief spinner icon on refresh button

### Data Freshness Indicators
```
┌─────────────────────────┐
│ BTC $71,151             │
│ Updated 15s ago    🟢   │  ← green = fresh (< 60s)
└─────────────────────────┘

┌─────────────────────────┐
│ BTC $71,151             │
│ Updated 5m ago     🟡   │  ← yellow = getting stale (1-5min)
└─────────────────────────┘

┌─────────────────────────┐
│ BTC $71,151             │
│ Updated 15m ago    🔴   │  ← red = stale (> 5min)
└─────────────────────────┘
```

### Sentiment Badge Interaction
- Hover on sentiment score → tooltip with AI explanation
- Example: "35/100 — Bearish pressure from declining price and negative funding rate"

### Quick Action Pills (Chat Tab)
- Horizontal scrollable row
- Tap → inserts pre-built prompt as user message → auto-sends
- Disabled while AI is responding
- Visually: outlined pills, orange on hover/tap

### Trade Now Modal
```
┌─────────────────────────────────────────┐
│                                    [×]  │
│                                         │
│     Trade BTCUSD on Delta Exchange      │
│                                         │
│     Current Price: $71,151              │
│     24h Change: -1.06%                  │
│                                         │
│     This is a demo feature. Trading     │
│     is not yet connected.               │
│                                         │
│     [Open Delta Exchange →]             │
│     (opens delta.exchange in new tab)   │
│                                         │
└─────────────────────────────────────────┘
```

### Chart Resolution Switching
- Buttons: `1H` `4H` `1D` `1W`
- Active: filled orange button
- Inactive: outlined button
- On switch: brief skeleton while new candles load
- Chart preserves scroll/zoom state when possible

### Token Selector (Research)
- Click → opens searchable dropdown
- Type to filter (matches symbol and name)
- Shows icon + symbol + name per option
- Grouped by "Popular" (BTC, ETH, SOL) then alphabetical
- Selection → updates URL param → triggers data fetch

---

## Accessibility

### Keyboard Navigation
- Tab order: sidebar → header → main content
- Enter/Space to activate buttons, pills, cards
- Escape to close modals and dropdowns
- Arrow keys to navigate token selector options

### Screen Readers
- All images have alt text (token icons: "Bitcoin icon")
- Sentiment badges: `aria-label="Sentiment: positive, score 72 out of 100"`
- Chart: `aria-label="Price chart for BTCUSD, 1 day candles"`
- Loading skeletons: `aria-busy="true"`, `aria-label="Loading..."`

### Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- White (#FFFFFF) on background (#101013) = 17.4:1 ratio
- Secondary text (#9CA3AF) on background (#101013) = 6.4:1 ratio
- Orange (#F7931A) on background (#101013) = 5.2:1 ratio

### Motion
- Respect `prefers-reduced-motion`: disable shimmer, transitions
- No auto-playing animations
- Chart animations can be disabled

---

## Mobile-Specific Patterns

### Swipe Gestures
- None in v1 (keep it simple)

### Touch Targets
- Minimum 44x44px for all interactive elements
- Pill buttons: 36px height minimum, generous horizontal padding
- Card tap areas: entire card is clickable (for "More Info")

### Viewport
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`
- Safe area insets for notched devices (bottom nav)

### Mobile Token Cards
- Stack vertically (1 card per row)
- Swipeable horizontal carousel (optional v2 enhancement)
- Full-width cards with 16px horizontal padding

### Mobile Chat
- Input sticks to bottom above keyboard
- Messages scroll up as new ones arrive
- Quick actions row scrolls horizontally

---

## Performance UX

### Perceived Speed
- Static layout renders instantly (sidebar, header, banners)
- Skeletons appear within 100ms
- Cached data serves in < 200ms (Vercel KV)
- AI summary may take 2-5s on cache miss → show typing indicator

### Streaming Chat
- Tokens appear one by one (like ChatGPT)
- Show "thinking" dots before first token arrives
- User can type new message while AI is still responding (queued)

### Chart Performance
- Lazy load TradingView library (dynamic import)
- Initial chart render: < 500ms after library loads
- Smooth 60fps pan/zoom on desktop
- Reduced data points on mobile (1D instead of 1H by default)
