# Design System

Inspired by Delta Exchange — premium dark-mode fintech aesthetic with blue-tinted surfaces, amber-orange accents, and micro-details that feel alive.

Research-driven: color science from Vercel Geist, Stripe, Binance, Coinbase, Bybit, Linear.

---

## 1. Design Philosophy

- **Dark-first**: Blue-tinted charcoal backgrounds convey premium fintech trust
- **High contrast**: Off-white text on layered dark surfaces; amber-orange for action
- **Information density**: Clean layouts that surface data without clutter
- **Progressive disclosure**: Section labels → headings → body → CTAs guide the eye
- **Alive**: Micro-animations, glow effects, and gradient accents make the UI feel responsive
- **90/5/5 rule**: 90% neutral surfaces, 5% brand accent (orange), 5% semantic colors

---

## 2. Color System

### Surface Layers (Dark Theme — Default)

5-level surface system with blue-tinted slate bases (~3% lightness increments):

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--bg-base` | `#08080c` | `8, 8, 12` | Page background |
| `--bg-surface` | `#0f1016` | `15, 16, 22` | Main content area, sidebar |
| `--bg-card` | `#12141c` | `18, 20, 28` | Cards, panels, modals |
| `--bg-elevated` | `#1a1c26` | `26, 28, 38` | Hover states, nested cards, dropdowns |
| `--bg-active` | `#252838` | `37, 40, 56` | Active/selected states, pressed |

### Borders (rgba for flexibility)

| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(255,255,255,0.04)` | Faint separators, recessed areas |
| `--border-default` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-strong` | `rgba(255,255,255,0.10)` | Hover borders, emphasized separators |
| `--border-accent` | `rgba(245,158,11,0.20)` | Featured cards, active borders |
| `--border-accent-strong` | `rgba(245,158,11,0.40)` | CTA cards, selected items |

### Brand Accent (Amber-Orange)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#F59E0B` | Primary CTA buttons, active nav, labels |
| `--accent-hover` | `#FBBF24` | Button hover (lighter) |
| `--accent-active` | `#D97706` | Button press (darker) |
| `--accent-muted` | `rgba(245,158,11,0.12)` | Badge backgrounds, subtle highlights |
| `--accent-subtle` | `rgba(245,158,11,0.06)` | Ambient glow, page background tint |

### Trading Colors (Binance Standard)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-gain` | `#0ECB81` | Profit, buy, positive change |
| `--color-gain-text` | `#2DD4A0` | Lighter green for text on dark bg |
| `--color-gain-muted` | `rgba(14,203,129,0.12)` | Badge bg, chart volume up |
| `--color-loss` | `#F6465D` | Loss, sell, negative change |
| `--color-loss-text` | `#FF6B7A` | Lighter red for text on dark bg |
| `--color-loss-muted` | `rgba(246,70,93,0.12)` | Badge bg, chart volume down |

### Semantic Colors

| Token | Hex | Muted | Wash | Usage |
|-------|-----|-------|------|-------|
| `--info` | `#3B82F6` | `rgba(59,130,246,0.12)` | `#001033` | Links, info states |
| `--warning` | `#FBBF24` | `rgba(251,191,36,0.12)` | `#330D00` | Caution, stale data |
| `--danger` | `#F6465D` | `rgba(246,70,93,0.12)` | `#420320` | Errors, destructive |
| `--success` | `#0ECB81` | `rgba(14,203,129,0.12)` | `#001F12` | Confirmation, positive |

### Text

| Token | Hex | Contrast on `#08080c` | Usage |
|-------|-----|----------------------|-------|
| `--text-primary` | `#F2F2F7` | 16.8:1 | Headings, primary content |
| `--text-secondary` | `#8E8E93` | 5.1:1 | Body text, descriptions |
| `--text-tertiary` | `#636366` | 3.2:1 | Captions, labels, placeholders |
| `--text-disabled` | `#48484A` | 2.1:1 | Disabled states (decorative only) |
| `--text-accent` | `#F59E0B` | 6.8:1 | Section labels, links |
| `--text-on-accent` | `#0a0a0f` | — | Dark text on orange buttons |

### Light Theme

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#FAFAFA` | Page background |
| `--bg-surface` | `#FFFFFF` | Content area |
| `--bg-card` | `#FFFFFF` | Cards |
| `--bg-elevated` | `#F3F4F6` | Hover, nested |
| `--border-default` | `rgba(0,0,0,0.08)` | Borders |
| `--accent` | `#F59E0B` | Same accent |
| `--text-primary` | `#111827` | Headings |
| `--text-secondary` | `#4B5563` | Body |

---

## 3. Typography

### Font Stack

```
--font-sans: "Inter", "SF Pro Display", -apple-system, system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Mono", monospace;
```

### Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| `hero` | 2.25rem (36px) | 700 | 1.2 | -0.02em | Portfolio value, hero |
| `h1` | 1.875rem (30px) | 700 | 1.25 | -0.01em | Page titles |
| `h2` | 1.5rem (24px) | 700 | 1.3 | -0.01em | Section headings |
| `h3` | 1.25rem (20px) | 600 | 1.35 | 0 | Card titles |
| `h4` | 1.125rem (18px) | 600 | 1.4 | 0 | Sub-sections |
| `body` | 0.9375rem (15px) | 400 | 1.5 | 0 | Body text (crypto standard) |
| `small` | 0.8125rem (13px) | 400 | 1.4 | 0.01em | Secondary info |
| `xs` | 0.75rem (12px) | 500 | 1.3 | 0.04em | Labels, badges, uppercase |
| `xxs` | 0.6875rem (11px) | 400 | 1.3 | 0 | Chart axis labels |
| `price-lg` | 1.5rem (24px) | 600 | 1.2 | -0.01em | Asset prices (mono) |
| `price-md` | 1.125rem (18px) | 600 | 1.3 | 0 | Table prices (mono) |
| `price-sm` | 0.875rem (14px) | 500 | 1.4 | 0 | Compact prices (mono) |

### Price/Data Typography

```css
.price, .amount, .percentage, .data-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
```

### Section Labels

```css
.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
}
```

---

## 4. Spacing & Layout

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--s-1` | 4px | Icon-to-text gap |
| `--s-2` | 8px | Inline gaps |
| `--s-3` | 12px | Input padding, small gaps |
| `--s-4` | 16px | Card padding, stack gaps |
| `--s-5` | 24px | Section sub-gaps |
| `--s-6` | 32px | Between card groups |
| `--s-7` | 48px | Section separation |
| `--s-8` | 64px | Major section breaks |

### Container

```
--container-max: 1200px;
--container-padding: 16px (mobile) / 32px (desktop);
```

### Grid

- 12-column desktop, 1-2 column mobile
- Gap: 16px between cards
- Feature grids: 2x2 desktop, stacked mobile

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Badges, chips |
| `--radius-sm` | 6px | Buttons, tags |
| `--radius-md` | 8px | Inputs |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Featured cards, modals |
| `--radius-2xl` | 20px | Hero sections |
| `--radius-full` | 9999px | Pills, avatars |

---

## 5. Component Styles

### Buttons

**Primary (Amber CTA)**
```css
.btn-primary {
  background: var(--accent);
  color: var(--text-on-accent);   /* dark text on orange */
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  transition: all 200ms ease;
}
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}
```

**Ghost (Outlined)**
```css
.btn-ghost {
  background: transparent;
  color: var(--accent);
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 200ms ease;
}
.btn-ghost:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.6);
}
```

### Cards

**Standard Card**
```css
.card {
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
```

**Featured Card (with glow)**
```css
.card-featured {
  background: linear-gradient(135deg, rgba(245,158,11,0.06) 0%, var(--bg-card) 50%, rgba(245,158,11,0.03) 100%);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 16px;
  box-shadow: 0 0 40px rgba(245, 158, 11, 0.04);
}
.card-featured:hover {
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.06), inset 0 1px 0 rgba(255,255,255,0.04);
}
```

### Inputs

```css
.input {
  background: var(--bg-base);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.9375rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
.input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

### Badges / Pills

```css
.badge { padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-gain { background: rgba(14,203,129,0.12); color: #2DD4A0; }
.badge-loss { background: rgba(246,70,93,0.12); color: #FF6B7A; }
.badge-accent { background: rgba(245,158,11,0.12); color: #F59E0B; }
.badge-neutral { background: rgba(255,255,255,0.06); color: #8E8E93; }
```

### Navigation

```css
.nav-link {
  color: var(--text-tertiary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 150ms ease;
}
.nav-link:hover { color: var(--text-primary); }
.nav-link--active { color: var(--text-primary); }
.nav-link--active::before {
  /* Orange left bar indicator — animated via layoutId in Framer Motion */
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
```

---

## 6. Premium Micro-Details

### Ambient Page Gradient

Subtle brand glow at top of page — Phantom/Rainbow wallet style:

```css
.page-bg {
  background-color: var(--bg-base);
  background-image: radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(245, 158, 11, 0.04),
    transparent
  );
}
```

### Noise Texture

2-3% opacity grain overlay for depth:

```css
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
```

### Gradient Separators

```css
.separator {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
}
```

### Custom Scrollbars

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
```

### Selection Color

```css
::selection { background: rgba(245, 158, 11, 0.3); color: #fff; }
```

### Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.2)` | Subtle lift |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)` | Cards |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.15)` | Dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)` | Modals |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)` | Overlays |
| `--shadow-glow-sm` | `0 0 12px rgba(245,158,11,0.08)` | Subtle brand glow |
| `--shadow-glow-md` | `0 0 24px rgba(245,158,11,0.10)` | Button hover glow |
| `--shadow-glow-lg` | `0 0 48px rgba(245,158,11,0.12)` | Featured card glow |

---

## 7. Data Visualization

### Candlestick Colors

```css
--candle-up-body: #0ECB81;
--candle-up-wick: #0ECB81;
--candle-down-body: #F6465D;
--candle-down-wick: #F6465D;
```

### Chart Theme

```css
--chart-bg: var(--bg-card);
--chart-grid: rgba(255, 255, 255, 0.04);
--chart-grid-major: rgba(255, 255, 255, 0.08);
--chart-crosshair: rgba(255, 255, 255, 0.3);
--chart-axis-text: rgba(255, 255, 255, 0.35);
--chart-volume-up: rgba(14, 203, 129, 0.25);
--chart-volume-down: rgba(246, 70, 93, 0.25);
--chart-line-primary: #F59E0B;
```

### Multi-Series Palette

```
#F59E0B (orange/BTC), #627EEA (ETH blue), #2DD4A0 (teal),
#A78BFA (purple), #F472B6 (pink), #38BDF8 (sky), #FBBF24 (yellow)
```

### Fear & Greed Color Scale

| Range | Label | Color |
|-------|-------|-------|
| 0-24 | Extreme Fear | `#F6465D` |
| 25-44 | Fear | `#F59E0B` |
| 45-55 | Neutral | `#8E8E93` |
| 56-74 | Greed | `#0ECB81` |
| 75-100 | Extreme Greed | `#16A34A` |

---

## 8. Motion & Transitions

| Property | Duration | Easing | Usage |
|----------|----------|--------|-------|
| Color/opacity | 150ms | `ease` | Hover states, fades |
| Background | 200ms | `ease` | Button hovers |
| Transform | 200ms | `[0.16, 1, 0.3, 1]` | Scale, translate |
| Layout/slide | 300ms | `[0.4, 0, 0.2, 1]` | Accordions, drawers |
| Page enter | 300ms | `[0.16, 1, 0.3, 1]` | Route changes |
| Spring (gentle) | — | `stiffness: 300, damping: 30` | Layout animations |
| Spring (bouncy) | — | `stiffness: 400, damping: 25` | Tab indicators |

Rules:
- `@media (prefers-reduced-motion: reduce)` — disable all
- `@media (hover: hover)` — hover effects only on pointer devices
- All animations under 400ms

---

## 9. Iconography

- **Library**: Lucide React (outline, 1.5px stroke, rounded caps)
- **Sizes**: 16px (inline), 20px (buttons), 24px (cards), 32px (features)
- **Color**: Inherit from parent text, or semantic color for emphasis
- **Containers**: Rounded-square (10px radius) with translucent colored backgrounds
