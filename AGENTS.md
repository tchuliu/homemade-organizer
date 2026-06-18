# AGENTS.md — Homemade Organizer

## Build & run

```bash
npm run dev      # Vite dev server
npm run build    # Vite production build
npm run preview  # Vite preview (serve dist/)
```

No linter/formatter configured yet.

## Tech stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite 8** + `@vitejs/plugin-vue`
- **Tailwind CSS v4** + `@tailwindcss/vite`
- **Vue Router 5** (web history mode, SPA)
- **Supabase** (`@supabase/supabase-js ^2.108`) — backend/database
- **Vercel** (SPA rewrites via `vercel.json`)

## Project structure

```
src/
  main.js          — app bootstrap
  App.vue           — root wrapper (dark bg + router-view)
  style.css         — Tailwind import
  router/index.js   — routes: "/" → HomeView, "/home/:id" → HomeDetail
  views/
    HomeView.vue    — landing page (create/join home)
    HomeDetail.vue  — main organizer view (rooms, items, budget)
  lib/
    supabase.js     — Supabase client singleton
    recentHomes.js  — localStorage recent homes helper
```

## Data model (Supabase)

Tables: `homes`, `rooms`, `items` (see `supabase-schema.sql`).
- `items.vendor_links` is JSONB storing purchase options (model, store, price, URL, notes, preferred).
- RLS is open (no auth) — access controlled only by knowing the home UUID.

## Conventions

- Currency: **BRL / pt-BR** — use shared `formatCurrency(value)`. Currently defined inline in `HomeDetail.vue:264`; future extraction to `src/lib/currency.js`.
- All UI text in English for now; BRL is the default display currency.
- Dark theme (`bg-gray-950 text-gray-100`).
- Form modals: autofocus first field, Enter to submit, validate before save, show loading/error states.
- Keep `HomeDetail.vue` as single-file until it becomes unmaintainable, then split into components (`BudgetSummary`, `RoomsList`, `ItemsList`, etc.).
- Follow the roadmap priority order: P0 → P1 → P2 → P3 → P4.
