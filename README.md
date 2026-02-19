# AIO Pulse — Next.js Boilerplate

Enterprise-grade AI Search Visibility Platform built with **Next.js 14 App Router**, **TypeScript (strict)**, **Tailwind CSS v3**, and a scalable component architecture.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v3 + CSS Variables |
| State | Zustand (global) + React hooks (local) |
| UI Primitives | Radix UI |
| Animations | Framer Motion |
| Charts | Recharts |
| Validation | Zod |
| Theme | next-themes |
| Toasts | react-hot-toast |
| Linting | ESLint + Prettier |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, theme, toaster)
│   ├── page.tsx                  # Landing page
│   ├── not-found.tsx             # 404 page
│   ├── error.tsx                 # Global error boundary
│   ├── auth/
│   │   └── login/page.tsx        # Login page
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard shell (Sidebar + TopBar)
│   │   └── page.tsx              # Dashboard overview
│   └── api/
│       └── analyze/route.ts      # POST /api/analyze
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx            # CVA button with variants
│   │   ├── Card.tsx              # Card + CardHeader/Body/Footer
│   │   └── index.tsx             # Badge, Input, Textarea, Select, Spinner
│   └── layout/
│       ├── Sidebar.tsx           # Collapsible sidebar with active states
│       └── TopBar.tsx            # Header with search + theme toggle
│
├── hooks/
│   └── index.ts                  # useToggle, useClipboard, useDebounce,
│                                 # useAsyncFetch, useKeywordAnalysis,
│                                 # useLocalStorage, useMediaQuery,
│                                 # useOutsideClick, usePrevious
│
├── lib/
│   ├── utils.ts                  # cn(), format*, validate*, array/object utils
│   ├── constants.ts              # App-wide constants + navigation config
│   ├── validations.ts            # Zod schemas
│   ├── store.ts                  # Zustand global store
│   └── export.ts                 # CSV/JSON export utilities
│
├── types/
│   └── index.ts                  # All TypeScript types & interfaces
│
└── styles/
    └── globals.css               # CSS tokens, Tailwind directives, utilities
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking (no emit)
npm run format       # Prettier format
```

---

## Key Design Decisions

### App Router (Next.js 14)
- All pages use the new App Router with Server Components by default
- Client Components are marked with `'use client'` only where needed
- Layouts cascade: root → dashboard → page

### TypeScript Strict Mode
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- All types defined in `src/types/index.ts`
- No `any` — use `unknown` and narrow

### State Management
- **Zustand** for global cross-page state (scan history, share stats, sidebar)
- **React hooks** for component-local state
- **No localStorage** in components — abstracted via `useLocalStorage` hook

### Styling Philosophy
- CSS variables for design tokens (`--color-brand`, `--radius-*`, etc.)
- Tailwind for utility classes
- `cn()` (clsx + tailwind-merge) for conditional class merging
- CVA (class-variance-authority) for component variant systems

### API Routes
- All API routes in `src/app/api/`
- Request validation with Zod schemas from `src/lib/validations.ts`
- Consistent response envelope: `ApiResponse<T>`
- Built-in rate limiting (swap for Redis in production)

---

## Adding New Pages

```tsx
// src/app/dashboard/my-page/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Page' }

export default function MyPage() {
  return <div className="animate-in space-y-8">...</div>
}
```

Add to sidebar in `src/components/layout/Sidebar.tsx`.

---

## Adding New API Routes

```ts
// src/app/api/my-route/route.ts
import { NextResponse } from 'next/server'
import { mySchema } from '@/lib/validations'

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = mySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 422 })
  }
  // ... logic
  return NextResponse.json({ success: true, data: result })
}
```

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy
```

Set environment variables in Vercel dashboard.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## License

MIT
