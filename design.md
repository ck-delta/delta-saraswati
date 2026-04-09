# Delta Exchange — Design & UI Analysis

## Brand Identity
Delta Exchange positions itself as India's leading crypto derivatives exchange, offering futures, options, spot, spreads, and IRS products. The design communicates **institutional-grade sophistication** with accessibility for Indian retail traders. Registered with FIU — Govt of India.

---

## Color Scheme

### Theme System
Delta uses a **dual-theme system** with regional variants, managed via CSS custom properties and persisted in `localStorage` (`delta_theme`).

| Theme Variant       | `--primaryBackground` | `--primaryTheme` (Accent) |
|---------------------|-----------------------|---------------------------|
| Light               | `#fafafa` (off-white) | `#2894f9` (blue)          |
| Dark                | `#101013` (near-black)| `#2894f9` (blue)          |
| Indian Light        | `#fafafa`             | `#fd7d02` (orange)        |
| Indian Dark         | `#101013`             | `#fd7d02` (orange)        |
| Indian Demo Light   | `#fafafa`             | `#fd7d02`                 |
| Indian Demo Dark    | `#101013`             | `#fd7d02`                 |

### Additional Design Tokens (referenced in CSS)
- `--main-bg-surface-alt` — alternate surface/container background
- `--brand-bg-primary` — primary brand background (used in loaders, badges)

### Trading UI Colors (standard crypto conventions)
- **Buy/Long** — Green tones
- **Sell/Short** — Red tones
- **Neutral/Info** — Blue (`#2894f9`) or Orange (`#fd7d02` for Indian theme)

---

## Typography
- Clean **sans-serif** font family throughout
- Bold headlines for feature sections and product names
- Monospace font likely used for price data, order books, and API docs
- Clear size hierarchy: large hero text > section headings > body > metadata
- Light-on-dark text in dark mode for high contrast readability

---

## Layout Architecture

### Trading Dashboard
- **Full viewport**: `width: 100vw; height: 100vh` — maximizes screen real estate
- **Multi-panel layout**: chart area, order book, trade form, positions/orders panel
- React-based SPA with dynamically loaded components
- Responsive design using viewport-relative units

### Homepage Sections
1. **Hero** — Prominent CTA with "$30,000 Trading Bonus", app download links
2. **Feature Tiles** — "Innovative Products", "Institutional-grade", "Safe & Secure", "24/7 Support"
3. **Markets Table** — Dynamic tabs: Futures, Options, Spot, Spreads, IRS
4. **Community Section** — "India's Leading Crypto Trading Community"

---

## Navigation

### Desktop
- **Top navbar**: Markets, Futures, Options (horizontal with dropdowns)
- Side/wallet integration for account functions
- Theme toggle (light/dark)

### Mobile
- Hamburger menu with sections: Futures, Mock Trading, Research & Analytics, Delta Token
- Tab-based product selector for contract types

### Footer
- Company: About, Careers, Press
- Resources: API Docs, Blog, Analytics
- Information: Fees, Contract Specs, Settlement Prices
- Support & Legal links

---

## Component Patterns

### Cards
- Subtle shadows with rounded corners
- Grid layout for feature tiles and product showcases
- Blog cards: featured image (16:9), category badge, headline, author avatar, date

### Buttons
- Primary CTA buttons in accent color (`#2894f9` blue or `#fd7d02` orange)
- "Sign Up" and trading action buttons prominently styled
- Clear visual hierarchy for conversion-critical actions

### Loading States
- Animated 3-dot ellipsis loader (`lds-ellipsis`)
- 60px wide, 9px dots with cubic-bezier easing
- 0.6s infinite animation cycles
- Centered overlay positioning

### Blog/Content
- 3-column responsive card grid
- Category filtering: Educational, Trading Tips, Research, News, Platform Updates, Offers, etc.
- Pagination for 380+ articles
- Author attribution with circular avatars

---

## Key Product Features (design-relevant)
- **Basket Orders** — place multiple orders simultaneously
- **Strategy Builder** — create and analyze multi-leg strategies
- **Portfolio Margin** — cross-margin with efficient collateral use
- **Daily Expiries** — flexible contract timeline options
- **Easy Options** — simplified directional trading interface
- **INR Settlement** — Indian market focus

---

## Technical Stack (observed)
- React-based SPA
- CSS custom properties for theming
- localStorage for theme persistence
- Google Tag Manager integration
- AVIF image format for optimization
- Dynamic component loading (trading panels load after bootstrap)

---

## Design Philosophy
- **Dark-first**: Trading interface defaults to dark mode (standard in crypto)
- **Data-dense**: Maximizes information density for active traders
- **Regional adaptation**: Orange accent for Indian market vs blue for global
- **Professional & minimal**: Reduced visual noise, clean typography, structured layouts
- **Trust signals**: FIU registration, institutional-grade messaging, 24/7 support emphasis
