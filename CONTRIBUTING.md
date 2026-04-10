# Contributing to Delta Saraswati

Delta Saraswati is a proprietary project. Contributions are limited to authorized team members. This document outlines the conventions and processes for internal development.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **AI Inference:** Groq (Llama 3.3 70B)
- **Hosting:** Vercel (with KV caching)

---

## Environment Setup

1. Clone the repository.
2. Copy `.env.example` to `.env.local` and fill in the required API keys.
3. Install dependencies: `pnpm install`
4. Start the development server: `pnpm dev`

---

## Branch Naming

Use the following prefixes for all branches:

- `feature/` for new features (e.g., `feature/order-book-heatmap`)
- `fix/` for bug fixes (e.g., `fix/funding-rate-refresh`)
- `docs/` for documentation changes (e.g., `docs/update-privacy-policy`)

---

## Commit Messages

Write clear, concise commit messages in the imperative mood. Use the following prefixes:

- `feat:` for new features
- `fix:` for bug fixes
- `refactor:` for code restructuring without behavior changes
- `docs:` for documentation updates
- `style:` for formatting or visual changes
- `chore:` for build, config, or dependency updates

Example: `feat: add ADX trend strength indicator to dashboard`

---

## Code Style

- Use TypeScript strict mode. Avoid `any` types unless absolutely necessary.
- Prefer named exports over default exports.
- Keep components small and focused. Extract shared logic into hooks or utility functions.
- Use Tailwind utility classes directly. Avoid custom CSS unless Tailwind cannot express the style.
- Follow existing patterns in the codebase for consistency.

---

## Pull Request Process

1. Create a branch from `main` using the naming conventions above.
2. Make your changes and verify they build without errors: `pnpm build`
3. Open a pull request against `main` with a clear title and description.
4. Request a review from at least one team member.
5. Squash and merge after approval.

---

*This guide is intended for internal team members only. External contributions are not accepted.*
